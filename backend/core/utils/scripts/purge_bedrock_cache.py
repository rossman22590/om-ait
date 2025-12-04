#!/usr/bin/env python3
"""
Purge all Redis/Valkey cached data that might contain Bedrock model IDs.

This script:
1. Flushes all agent config caches
2. Checks for and reports any Bedrock model IDs in the database
3. Optionally updates database records to use Anthropic models
"""

import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.services.supabase import DBConnection
from core.services import redis
from core.utils.logger import logger


async def purge_redis_cache():
    """Purge all cached agent configurations from Redis."""
    logger.info("="*80)
    logger.info("PURGING REDIS/VALKEY CACHE")
    logger.info("="*80)

    try:
        # Initialize Redis client
        client = await redis.get_client()

        # Get all agent config keys
        config_keys = await redis.keys("agent_config:*")
        user_mcp_keys = await redis.keys("user_mcps:*")
        suna_keys = await redis.keys("static_suna_config")

        all_keys = config_keys + user_mcp_keys + suna_keys

        logger.info(f"Found {len(all_keys)} cached keys to purge")
        logger.info(f"  - Agent configs: {len(config_keys)}")
        logger.info(f"  - User MCPs: {len(user_mcp_keys)}")
        logger.info(f"  - Suna config: {len(suna_keys)}")

        if all_keys:
            deleted = 0
            for key in all_keys:
                try:
                    await redis.delete(key)
                    deleted += 1
                except Exception as e:
                    logger.warning(f"Failed to delete key {key}: {e}")

            logger.info(f"[OK] Purged {deleted}/{len(all_keys)} cached keys")
        else:
            logger.info("[OK] No cached keys found")

        # Get connection stats
        conn_info = await redis.get_connection_info()
        logger.info(f"\nRedis connection stats:")
        logger.info(f"  Pool max connections: {conn_info.get('pool', {}).get('max_connections')}")
        logger.info(f"  Server connected clients: {conn_info.get('server', {}).get('connected_clients')}")

    except Exception as e:
        logger.error(f"[ERROR] Failed to purge Redis cache: {e}")
        raise


async def check_database_models():
    """Check for Bedrock model IDs in database."""
    logger.info("\n" + "="*80)
    logger.info("CHECKING DATABASE FOR BEDROCK MODEL IDS")
    logger.info("="*80)

    db = DBConnection()
    await db.initialize()
    client = await db.client

    # Check agent_versions table
    logger.info("\nChecking agent_versions table...")

    versions_result = await client.from_('agent_versions').select('version_id, agent_id, config').execute()

    bedrock_versions = []
    for version in versions_result.data:
        config = version.get('config', {}) or {}
        model = config.get('model', '')

        if model and ('bedrock' in model.lower() or 'arn:aws' in model):
            bedrock_versions.append({
                'version_id': version['version_id'],
                'agent_id': version['agent_id'],
                'model': model
            })

    if bedrock_versions:
        logger.warning(f"[WARN] Found {len(bedrock_versions)} agent versions with Bedrock model IDs:")
        for v in bedrock_versions[:10]:  # Show first 10
            logger.warning(f"  - Version {v['version_id']}: {v['model']}")
        if len(bedrock_versions) > 10:
            logger.warning(f"  ... and {len(bedrock_versions) - 10} more")
    else:
        logger.info("[OK] No Bedrock model IDs found in agent_versions")

    # Check templates table
    logger.info("\nChecking agent_templates table...")

    templates_result = await client.from_('agent_templates').select('template_id, name, metadata').execute()

    bedrock_templates = []
    for template in templates_result.data:
        metadata = template.get('metadata', {}) or {}
        model = metadata.get('model', '')

        if model and ('bedrock' in model.lower() or 'arn:aws' in model):
            bedrock_templates.append({
                'template_id': template['template_id'],
                'name': template['name'],
                'model': model
            })

    if bedrock_templates:
        logger.warning(f"[WARN] Found {len(bedrock_templates)} templates with Bedrock model IDs:")
        for t in bedrock_templates:
            logger.warning(f"  - Template {t['template_id']} ({t['name']}): {t['model']}")
    else:
        logger.info("[OK] No Bedrock model IDs found in agent_templates")

    return bedrock_versions, bedrock_templates


async def fix_database_models(bedrock_versions, bedrock_templates):
    """Update database records to use Anthropic models."""
    logger.info("\n" + "="*80)
    logger.info("FIXING DATABASE MODEL IDS")
    logger.info("="*80)

    db = DBConnection()
    await db.initialize()
    client = await db.client

    anthropic_model = "anthropic/claude-sonnet-4-5-20250929"

    # Fix agent versions
    if bedrock_versions:
        logger.info(f"\nUpdating {len(bedrock_versions)} agent versions...")

        for v in bedrock_versions:
            try:
                # Get current config
                version_result = await client.from_('agent_versions').select('config').eq('version_id', v['version_id']).single().execute()

                if version_result.data:
                    config = version_result.data.get('config', {}) or {}
                    config['model'] = anthropic_model

                    # Update
                    await client.from_('agent_versions').update({
                        'config': config
                    }).eq('version_id', v['version_id']).execute()

                    logger.info(f"  [OK] Updated version {v['version_id']}: {v['model']} -> {anthropic_model}")
            except Exception as e:
                logger.error(f"  [ERROR] Failed to update version {v['version_id']}: {e}")

    # Fix templates
    if bedrock_templates:
        logger.info(f"\nUpdating {len(bedrock_templates)} templates...")

        for t in bedrock_templates:
            try:
                # Get current metadata
                template_result = await client.from_('agent_templates').select('metadata').eq('template_id', t['template_id']).single().execute()

                if template_result.data:
                    metadata = template_result.data.get('metadata', {}) or {}
                    metadata['model'] = anthropic_model

                    # Update
                    await client.from_('agent_templates').update({
                        'metadata': metadata
                    }).eq('template_id', t['template_id']).execute()

                    logger.info(f"  [OK] Updated template {t['template_id']} ({t['name']}): {t['model']} -> {anthropic_model}")
            except Exception as e:
                logger.error(f"  [ERROR] Failed to update template {t['template_id']}: {e}")

    if not bedrock_versions and not bedrock_templates:
        logger.info("[OK] No database records to fix")


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Purge Redis cache and fix Bedrock model IDs'
    )
    parser.add_argument(
        '--fix-database',
        action='store_true',
        help='Also update database records to use Anthropic models'
    )

    args = parser.parse_args()

    try:
        # Step 1: Purge Redis cache
        await purge_redis_cache()

        # Step 2: Check database
        bedrock_versions, bedrock_templates = await check_database_models()

        # Step 3: Fix database if requested
        if args.fix_database:
            if bedrock_versions or bedrock_templates:
                await fix_database_models(bedrock_versions, bedrock_templates)
            else:
                logger.info("\n[OK] No database fixes needed")
        elif bedrock_versions or bedrock_templates:
            logger.info("\n[WARN] To fix database records, run with --fix-database flag")

        logger.info("\n" + "="*80)
        logger.info("[OK] PURGE COMPLETE")
        logger.info("="*80)
        logger.info("\nNext steps:")
        logger.info("1. Restart your API server")
        logger.info("2. Check that chat is working")
        logger.info("3. Monitor logs for any Bedrock errors")

    except Exception as e:
        logger.error(f"\n[ERROR] Purge failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

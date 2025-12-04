#!/usr/bin/env python3
"""Check database for Bedrock model IDs in agent_runs and threads."""

import asyncio
from core.services.supabase import DBConnection
from core.utils.logger import logger

async def main():
    db = DBConnection()
    await db.initialize()
    client = await db.client

    print("="*80)
    print("CHECKING AGENT_RUNS FOR BEDROCK MODELS")
    print("="*80)

    # Check recent agent_runs
    runs = await client.from_('agent_runs').select('id, thread_id, metadata, created_at').order('created_at', desc=True).limit(100).execute()

    bedrock_runs = []
    for run in runs.data:
        metadata = run.get('metadata', {}) or {}
        model_name = metadata.get('model_name', '')
        if model_name and ('bedrock' in model_name.lower() or 'arn:aws' in model_name):
            bedrock_runs.append({
                'run_id': run['id'],
                'thread_id': run['thread_id'],
                'model': model_name,
                'created_at': run['created_at']
            })

    if bedrock_runs:
        print(f"\n⚠️  Found {len(bedrock_runs)} agent_runs with Bedrock models:")
        for r in bedrock_runs[:10]:
            print(f"  - Run {r['run_id']}: {r['model']}")
        if len(bedrock_runs) > 10:
            print(f"  ... and {len(bedrock_runs) - 10} more")
    else:
        print("\n✅ No Bedrock models in recent agent_runs")

    print("\n" + "="*80)
    print("CHECKING THREADS TABLE")
    print("="*80)

    # Check threads table for model_name
    threads = await client.from_('threads').select('thread_id, model_name, created_at').order('created_at', desc=True).limit(100).execute()

    bedrock_threads = []
    for thread in threads.data:
        model_name = thread.get('model_name', '')
        if model_name and ('bedrock' in model_name.lower() or 'arn:aws' in model_name):
            bedrock_threads.append({
                'thread_id': thread['thread_id'],
                'model': model_name,
                'created_at': thread['created_at']
            })

    if bedrock_threads:
        print(f"\n⚠️  Found {len(bedrock_threads)} threads with Bedrock models:")
        for t in bedrock_threads[:10]:
            print(f"  - Thread {t['thread_id']}: {t['model']}")
        if len(bedrock_threads) > 10:
            print(f"  ... and {len(bedrock_threads) - 10} more")
    else:
        print("\n✅ No Bedrock models in recent threads")

if __name__ == "__main__":
    asyncio.run(main())

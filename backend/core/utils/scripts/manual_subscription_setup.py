#!/usr/bin/env python3

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from decimal import Decimal

backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.services.supabase import DBConnection
from core.utils.logger import logger
from core.billing.credits.manager import credit_manager

async def manual_subscription_setup(
    account_id: str,
    subscription_id: str,
    tier_name: str,
    monthly_credits: Decimal,
    price_id: str = None,
    is_commitment: bool = False
):
    """Manually set up subscription for a user with known values."""
    logger.info("="*80)
    logger.info(f"MANUAL SUBSCRIPTION SETUP")
    logger.info("="*80)
    logger.info(f"Account ID: {account_id}")
    logger.info(f"Subscription ID: {subscription_id}")
    logger.info(f"Tier: {tier_name}")
    logger.info(f"Monthly credits: ${monthly_credits}")
    logger.info(f"Price ID: {price_id}")
    logger.info(f"Is commitment: {is_commitment}")

    db = DBConnection()
    await db.initialize()
    client = await db.client

    # Use current date as start, next month as next grant
    start_date = datetime.now(timezone.utc)
    next_grant = start_date + timedelta(days=30)

    update_data = {
        'tier': tier_name,
        'stripe_subscription_id': subscription_id,
        'billing_cycle_anchor': start_date.isoformat(),
        'next_credit_grant': next_grant.isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

    if is_commitment:
        end_date = start_date + timedelta(days=365)
        update_data.update({
            'commitment_type': 'yearly_commitment',
            'commitment_start_date': start_date.isoformat(),
            'commitment_end_date': end_date.isoformat(),
            'commitment_price_id': price_id,
            'can_cancel_after': end_date.isoformat()
        })
        logger.info(f"Setting up yearly commitment ending: {end_date.date()}")
    else:
        update_data.update({
            'commitment_type': None,
            'commitment_start_date': None,
            'commitment_end_date': None,
            'commitment_price_id': None,
            'can_cancel_after': None
        })

    # Update credit_accounts
    await client.from_('credit_accounts').upsert(
        {**update_data, 'account_id': account_id},
        on_conflict='account_id'
    ).execute()

    logger.info("[OK] Updated credit_accounts table")

    # Create commitment history if needed
    if is_commitment and price_id:
        existing_commitment = await client.from_('commitment_history').select('id').eq('stripe_subscription_id', subscription_id).execute()

        if not existing_commitment.data:
            end_date = start_date + timedelta(days=365)
            await client.from_('commitment_history').insert({
                'account_id': account_id,
                'commitment_type': 'yearly_commitment',
                'price_id': price_id,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'stripe_subscription_id': subscription_id
            }).execute()
            logger.info("[OK] Created commitment_history record")
        else:
            logger.info("[OK] Commitment_history record already exists")

    # Grant initial credits if balance is low
    current_balance = await client.from_('credit_accounts').select('balance').eq('account_id', account_id).execute()
    balance = Decimal(str(current_balance.data[0]['balance'])) if current_balance.data else Decimal('0')

    logger.info(f"Current balance: ${balance}")

    if balance < Decimal('1.0'):
        logger.info(f"Granting ${monthly_credits} initial credits...")

        result = await credit_manager.add_credits(
            account_id=account_id,
            amount=monthly_credits,
            is_expiring=True,
            description=f"Initial credits for {tier_name}"
        )

        if result.get('success'):
            logger.info(f"[OK] Granted ${monthly_credits} credits")
            logger.info(f"   New balance: ${result.get('new_total', 0)}")
        else:
            logger.error(f"[ERROR] Failed to grant credits: {result.get('error', 'Unknown error')}")
    else:
        logger.info(f"User already has ${balance} credits, skipping initial grant")

    # Verification
    final_account = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()

    if final_account.data:
        acc = final_account.data[0]
        logger.info("\n" + "="*80)
        logger.info("FINAL STATE")
        logger.info("="*80)
        logger.info(f"  Tier: {acc.get('tier')}")
        logger.info(f"  Balance: ${acc.get('balance')}")
        logger.info(f"  Subscription ID: {acc.get('stripe_subscription_id')}")
        logger.info(f"  Commitment type: {acc.get('commitment_type')}")
        logger.info(f"  Next credit grant: {acc.get('next_credit_grant')}")

    logger.info("\n" + "="*80)
    logger.info("[OK] SUBSCRIPTION SETUP COMPLETE")
    logger.info("="*80)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: py manual_subscription_setup.py <account_id> <subscription_id> <tier_name> <monthly_credits> [price_id] [is_commitment]")
        print("Example: py manual_subscription_setup.py 140678f7-794b-441f-962a-a87c1a81bb08 sub_1RLyW4G23sSyONuFK0bSqhxK tier_25_200 400.00")
        sys.exit(1)

    account_id = sys.argv[1]
    subscription_id = sys.argv[2]
    tier_name = sys.argv[3]
    monthly_credits = Decimal(sys.argv[4])
    price_id = sys.argv[5] if len(sys.argv) > 5 else None
    is_commitment = sys.argv[6].lower() == 'true' if len(sys.argv) > 6 else False

    asyncio.run(manual_subscription_setup(account_id, subscription_id, tier_name, monthly_credits, price_id, is_commitment))

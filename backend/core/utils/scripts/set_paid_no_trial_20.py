"""
Mark an account as paid (no trial) on the $20 plan (tier_2_20).

Usage:
  python set_paid_no_trial_20.py <account_id>

Example:
  python set_paid_no_trial_20.py 29c748cb-a2c4-4555-a941-6206e5324c9d
"""

import sys
import asyncio
from datetime import datetime, timedelta
from pathlib import Path

# Ensure backend is on path (same pattern used by other scripts)
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from decimal import Decimal
from core.services.supabase import DBConnection
from core.billing.config import get_tier_by_name
from core.billing.credit_manager import credit_manager


async def set_paid_no_trial(account_id: str, dummy_sub_id: str | None = None):
    db = DBConnection()
    client = await db.client

    # Fetch current account state
    current = await client.from_("credit_accounts").select(
        "account_id, tier, trial_status, payment_status, stripe_subscription_id, "
        "trial_started_at, trial_ends_at, balance, expiring_credits, non_expiring_credits"
    ).eq("account_id", account_id).execute()

    if not current.data:
        # Create minimal credit_account row if missing
        await client.from_("credit_accounts").insert({
            "account_id": account_id,
            "tier": "none",
            "balance": 0,
            "expiring_credits": 0,
            "non_expiring_credits": 0,
            "trial_status": "none",
        }).execute()
        current = await client.from_("credit_accounts").select("*").eq("account_id", account_id).execute()
        if not current.data:
            print(f"❌ Account not found and could not be created: {account_id}")
            sys.exit(1)

    print("\n📊 Current:")
    print(current.data[0])

    now = datetime.utcnow()
    update_data = {
        # Put user on $20 plan and mark as paid (no trial)
        "tier": "tier_2_20",
        "trial_status": "converted",
        # Fill trial window as completed to satisfy any checks
        "trial_started_at": (now - timedelta(days=7)).isoformat(),
        "trial_ends_at": now.isoformat(),
        "payment_status": "active",
        "stripe_subscription_id": dummy_sub_id or None,
        "last_payment_failure": None,
        # Touch updated_at for visibility
        "updated_at": now.isoformat(),
        "billing_cycle_anchor": now.isoformat(),
        "next_credit_grant": now.isoformat(),
    }

    result = await client.from_("credit_accounts").update(update_data).eq("account_id", account_id).execute()

    if not result.data:
        print("❌ Update failed")
        sys.exit(1)

    print("\n✅ Updated:")
    print(result.data[0])

    # Ensure trial history reflects a converted/paid state so UI won't offer trial
    try:
        await client.from_("trial_history").upsert({
            "account_id": account_id,
            "started_at": (now - timedelta(days=7)).isoformat(),
            "ended_at": now.isoformat(),
            "converted_to_paid": True,
            "status": "converted",
            "error_message": None,
        }, on_conflict="account_id").execute()
        print("\n🧹 Trial history updated to 'converted'.")
    except Exception as e:
        print(f"⚠️ Could not update trial_history: {e}")

    # Grant monthly credits for the $20 plan so user can run immediately
    try:
        tier = get_tier_by_name("tier_2_20")
        monthly = tier.monthly_credits if tier else Decimal("20.00")
        grant = await credit_manager.reset_expiring_credits(
            account_id,
            new_credits=monthly,
            description="Manual setup: Starter ($20) monthly credits"
        )
        print(f"\n💳 Credits granted: ${grant.get('new_expiring', monthly)} expiring (balance=${grant.get('total_balance')})")
    except Exception as e:
        print(f"⚠️ Could not grant credits: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python set_paid_no_trial_20.py <account_id> [dummy_stripe_subscription_id]")
        sys.exit(1)
    account_id = sys.argv[1]
    dummy_sub = sys.argv[2] if len(sys.argv) == 3 else None
    asyncio.run(set_paid_no_trial(account_id, dummy_sub))

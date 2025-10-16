"""
Script to fix account tier and balance
Usage: python fix_account_tier.py <account_id> <target_tier> <target_balance> [stripe_subscription_id]
Example: python fix_account_tier.py 4820fac0-b988-49fb-92fd-0b5324491d03 tier_6_50 50 sub_1RcyfKG23sSyONuFEpbKIasr
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import asyncio

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from core.utils.config import config
from core.services.supabase import DBConnection

async def fix_account_tier(account_id: str, target_tier: str, target_balance: float, stripe_sub_id: str = None):
    """
    Fix account tier and balance
    
    Args:
        account_id: The account ID to fix
        target_tier: The target tier (e.g., 'tier_50_400')
        target_balance: The target balance amount (e.g., 50.0)
    """
    
    # Initialize services
    db = DBConnection()
    client = await db.client
    
    print(f"\n🔧 Fixing Account Tier")
    print(f"Account ID: {account_id}")
    print(f"Target Tier: {target_tier}")
    print(f"Target Balance: ${target_balance}")
    if stripe_sub_id:
        print(f"Stripe Subscription ID: {stripe_sub_id}")
    print("-" * 60)
    
    try:
        # Get current account state
        print("\n📊 Current Account State:")
        result = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()
        
        if not result.data:
            print(f"❌ Account {account_id} not found")
            sys.exit(1)
        
        current = result.data[0]
        print(f"  Current Tier: {current.get('tier')}")
        print(f"  Current Balance: ${current.get('balance')}")
        print(f"  Trial Status: {current.get('trial_status')}")
        print(f"  Stripe Sub ID: {current.get('stripe_subscription_id')}")
        
        # Calculate new values
        current_balance = float(current.get('balance', 0))
        balance_difference = target_balance - current_balance
        
        # Set billing cycle anchor to now
        billing_cycle_anchor = datetime.utcnow().isoformat()
        next_credit_grant = (datetime.utcnow() + timedelta(days=30)).isoformat()
        
        # Update the account
        print(f"\n🔄 Updating account...")
        update_data = {
            'tier': target_tier,
            'balance': str(target_balance),
            'billing_cycle_anchor': billing_cycle_anchor,
            'next_credit_grant': next_credit_grant,
            'trial_status': 'converted',  # Mark trial as converted to paid subscription
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # If balance increased, update lifetime_granted
        if balance_difference > 0:
            current_lifetime_granted = float(current.get('lifetime_granted', 0))
            update_data['lifetime_granted'] = str(current_lifetime_granted + balance_difference)
            update_data['last_grant_date'] = datetime.utcnow().isoformat()
        
        # Add Stripe subscription ID if provided
        if stripe_sub_id:
            update_data['stripe_subscription_id'] = stripe_sub_id
        
        result = await client.from_('credit_accounts').update(update_data).eq('account_id', account_id).execute()
        
        if result.data:
            print("✅ Account updated successfully!")
            print(f"\n📊 New Account State:")
            new_state = result.data[0]
            print(f"  New Tier: {new_state.get('tier')}")
            print(f"  New Balance: ${new_state.get('balance')}")
            print(f"  Lifetime Granted: ${new_state.get('lifetime_granted')}")
            print(f"  Trial Status: {new_state.get('trial_status')}")
            print(f"  Stripe Sub ID: {new_state.get('stripe_subscription_id')}")
            print(f"  Billing Cycle Anchor: {new_state.get('billing_cycle_anchor')}")
            print(f"  Next Credit Grant: {new_state.get('next_credit_grant')}")
            
            print(f"\n✅ Account {account_id} successfully upgraded to {target_tier} with ${target_balance} balance")
        else:
            print("❌ Failed to update account")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 4 or len(sys.argv) > 5:
        print("Usage: python fix_account_tier.py <account_id> <target_tier> <target_balance> [stripe_subscription_id]")
        print("Example: python fix_account_tier.py 4820fac0-b988-49fb-92fd-0b5324491d03 tier_6_50 50 sub_1RcyfKG23sSyONuFEpbKIasr")
        sys.exit(1)
    
    account_id = sys.argv[1]
    target_tier = sys.argv[2]
    target_balance = float(sys.argv[3])
    stripe_sub_id = sys.argv[4] if len(sys.argv) == 5 else None
    
    asyncio.run(fix_account_tier(account_id, target_tier, target_balance, stripe_sub_id))

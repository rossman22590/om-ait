"""
Script to check account subscription details
Usage: python check_account_subscription.py <account_id>
Example: python check_account_subscription.py 4820fac0-b988-49fb-92fd-0b5324491d03
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import asyncio

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

import stripe
from core.utils.config import config
from core.services.supabase import DBConnection

async def check_account_subscription(account_id: str):
    """
    Check account subscription details from both database and Stripe
    
    Args:
        account_id: The account ID to check
    """
    
    # Initialize services using config
    stripe.api_key = config.STRIPE_SECRET_KEY
    db = DBConnection()
    client = await db.client
    
    print(f"\n🔍 Checking Account Subscription")
    print(f"Account ID: {account_id}")
    print("=" * 80)
    
    try:
        # Get account from credit_accounts
        print("\n📊 DATABASE - Credit Accounts:")
        print("-" * 80)
        result = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()
        
        if not result.data:
            print(f"❌ Account {account_id} not found in credit_accounts")
            sys.exit(1)
        
        account = result.data[0]
        
        # Display all fields
        print(f"  Tier: {account.get('tier')}")
        print(f"  Balance: ${account.get('balance')}")
        print(f"  Lifetime Granted: ${account.get('lifetime_granted')}")
        print(f"  Lifetime Purchased: ${account.get('lifetime_purchased')}")
        print(f"  Lifetime Used: ${account.get('lifetime_used')}")
        print(f"  Expiring Credits: ${account.get('expiring_credits')}")
        print(f"  Non-Expiring Credits: ${account.get('non_expiring_credits')}")
        print(f"  Trial Status: {account.get('trial_status')}")
        print(f"  Trial Started: {account.get('trial_started_at')}")
        print(f"  Trial Ends: {account.get('trial_ends_at')}")
        print(f"  Stripe Subscription ID: {account.get('stripe_subscription_id')}")
        print(f"  Last Processed Invoice: {account.get('last_processed_invoice_id')}")
        print(f"  Billing Cycle Anchor: {account.get('billing_cycle_anchor')}")
        print(f"  Next Credit Grant: {account.get('next_credit_grant')}")
        print(f"  Created: {account.get('created_at')}")
        print(f"  Updated: {account.get('updated_at')}")
        
        stripe_sub_id = account.get('stripe_subscription_id')
        
        # Check Stripe subscription if ID exists
        if stripe_sub_id and config.STRIPE_SECRET_KEY:
            print("\n💳 STRIPE - Subscription Details:")
            print("-" * 80)
            try:
                subscription = stripe.Subscription.retrieve(
                    stripe_sub_id,
                    expand=['items.data.price']
                )
                
                print(f"  Subscription ID: {subscription.id}")
                print(f"  Status: {subscription.status}")
                print(f"  Customer ID: {subscription.customer}")
                print(f"  Current Period Start: {datetime.fromtimestamp(subscription.current_period_start)}")
                print(f"  Current Period End: {datetime.fromtimestamp(subscription.current_period_end)}")
                print(f"  Cancel At Period End: {subscription.cancel_at_period_end}")
                
                if subscription.items and subscription.items.data:
                    print(f"\n  Subscription Items:")
                    for item in subscription.items.data:
                        price = item.price
                        print(f"    - Price ID: {price.id}")
                        print(f"      Amount: ${price.unit_amount / 100:.2f} {price.currency.upper()}")
                        print(f"      Interval: {price.recurring.interval}")
                        print(f"      Product: {price.product}")
                
                # Determine what tier this should be
                print(f"\n  🔍 Tier Analysis:")
                if subscription.items and subscription.items.data:
                    price_id = subscription.items.data[0].price.id
                    amount = subscription.items.data[0].price.unit_amount / 100
                    
                    # Map price to tier
                    tier_map = {
                        2: "tier_2_20",
                        6: "tier_6_50",
                        20: "tier_20_125",
                        50: "tier_50_400",
                        125: "tier_125_800",
                        200: "tier_200_1000",
                    }
                    
                    expected_tier = None
                    for price, tier in tier_map.items():
                        if amount == price:
                            expected_tier = tier
                            break
                    
                    print(f"    Stripe Price: ${amount}")
                    print(f"    Expected Tier: {expected_tier}")
                    print(f"    Current DB Tier: {account.get('tier')}")
                    
                    if expected_tier and expected_tier != account.get('tier'):
                        print(f"    ⚠️  MISMATCH DETECTED!")
                        print(f"    ⚠️  Database tier ({account.get('tier')}) doesn't match Stripe subscription (${amount} -> {expected_tier})")
                        print(f"\n    💡 Suggested Fix:")
                        print(f"       python backend/core/utils/scripts/fix_account_tier.py {account_id} {expected_tier} {amount} {stripe_sub_id}")
                    else:
                        print(f"    ✅ Tier matches subscription")
                
            except stripe.error.StripeError as e:
                print(f"  ❌ Stripe Error: {str(e)}")
        elif stripe_sub_id and not config.STRIPE_SECRET_KEY:
            print(f"\n💳 STRIPE - Subscription ID found but STRIPE_SECRET_KEY not set")
            print(f"  Subscription ID: {stripe_sub_id}")
        else:
            print(f"\n💳 STRIPE - No subscription ID in database")
        
        print("\n" + "=" * 80)
        print("✅ Check complete")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python check_account_subscription.py <account_id>")
        print("Example: python check_account_subscription.py 4820fac0-b988-49fb-92fd-0b5324491d03")
        sys.exit(1)
    
    account_id = sys.argv[1]
    asyncio.run(check_account_subscription(account_id))

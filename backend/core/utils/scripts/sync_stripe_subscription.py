#!/usr/bin/env python3
"""
Script to sync Stripe subscription to database for users whose subscription exists in Stripe but not in DB.

Usage:
    python sync_stripe_subscription.py --email user@example.com
    python sync_stripe_subscription.py --email biovidigal@gmail.com --dry-run
"""

import asyncio
import argparse
import sys
import os
from decimal import Decimal
from datetime import datetime, timezone

backend_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.append(backend_dir)

from core.services.supabase import DBConnection
from core.billing.config import get_tier_by_price_id, TIERS
from core.billing.credit_manager import credit_manager
from core.utils.logger import logger
import stripe
from core.utils.config import config

stripe.api_key = config.STRIPE_SECRET_KEY

async def find_user_by_email(email: str, client):
    """Find user and account by email."""
    try:
        user_result = await client.rpc('get_user_account_by_email', {'email_input': email.lower()}).execute()
        
        if not user_result.data:
            print(f"❌ User with email {email} not found in database")
            return None
            
        user_data = user_result.data
        user_id = user_data.get('primary_owner_user_id')
        account_id = user_data.get('id')
        account_name = user_data.get('name')
        
        if not user_id or not account_id:
            print(f"❌ Incomplete user data for email {email}")
            return None
            
        print(f"✅ Found user: {user_id} ({email})")
        print(f"✅ Found account: {account_id} ({account_name})")
        
        return {
            'user_id': user_id,
            'account_id': account_id,
            'email': email,
            'account_name': account_name
        }
        
    except Exception as e:
        print(f"❌ Error finding user: {e}")
        return None

async def get_credit_account(account_id: str, client):
    """Get credit account for user."""
    result = await client.from_('credit_accounts').select('*').eq('account_id', account_id).execute()
    
    if not result.data:
        print(f"❌ No credit account found for {account_id}")
        return None
        
    return result.data[0]

async def find_stripe_subscription(email: str):
    """Find active Stripe subscription for email."""
    try:
        # Find customer
        customers = stripe.Customer.list(email=email, limit=10)
        
        if not customers.data:
            print(f"❌ No Stripe customer found for {email}")
            return None
            
        customer = customers.data[0]
        print(f"✅ Found Stripe customer: {customer.id}")
        
        # Find active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=customer.id,
            status='active',
            limit=10
        )
        
        if not subscriptions.data:
            print(f"❌ No active subscriptions found for customer {customer.id}")
            return None
        
        # Prefer yearly subscriptions
        yearly_subs = []
        for sub in subscriptions.data:
            nickname = sub['items']['data'][0]['price'].get('nickname') or ''
            if 'yearly' in nickname.lower():
                yearly_subs.append(sub)
        
        # Use yearly if found, otherwise use first subscription
        sub = yearly_subs[0] if yearly_subs else subscriptions.data[0]
        
        # Fetch full subscription details
        full_sub = stripe.Subscription.retrieve(sub.id)
        
        price_id = full_sub['items']['data'][0]['price']['id']
        price_nickname = full_sub['items']['data'][0]['price'].get('nickname') or 'Unknown'
        
        print(f"✅ Found active subscription: {full_sub.id}")
        print(f"   Price: {price_id} ({price_nickname})")
        print(f"   Status: {full_sub.status}")
        
        # Check if subscription has billing period info
        if hasattr(full_sub, 'current_period_start') and hasattr(full_sub, 'current_period_end'):
            print(f"   Current period: {datetime.fromtimestamp(full_sub.current_period_start)} - {datetime.fromtimestamp(full_sub.current_period_end)}")
        else:
            print(f"   ⚠️  No billing period info available")
        
        return {
            'subscription': full_sub,
            'price_id': price_id,
            'customer_id': customer.id,
            'price_nickname': price_nickname
        }
        
    except Exception as e:
        print(f"❌ Error finding Stripe subscription: {e}")
        import traceback
        traceback.print_exc()
        return None

async def sync_subscription_to_db(user_data, credit_account, stripe_data, client, dry_run=False):
    """Sync Stripe subscription to database."""
    account_id = user_data['account_id']
    subscription = stripe_data['subscription']
    price_id = stripe_data['price_id']
    
    print(f"\n🔧 Syncing subscription for {user_data['email']}...")
    print(f"   Account ID: {account_id}")
    print(f"   Current DB state:")
    print(f"     - Tier: {credit_account['tier']}")
    print(f"     - Balance: ${credit_account['balance']}")
    print(f"     - Subscription ID: {credit_account.get('stripe_subscription_id', 'None')}")
    print(f"     - Trial Status: {credit_account.get('trial_status', 'None')}")

    # Get tier info from price
    tier_info = get_tier_by_price_id(price_id)
    if not tier_info:
        print(f"❌ Unknown price ID: {price_id}")
        return False
        
    correct_tier = tier_info.name
    monthly_credits = float(tier_info.monthly_credits)
    
    print(f"   Stripe subscription state:")
    print(f"     - Tier: {correct_tier}")
    print(f"     - Monthly credits: ${monthly_credits}")
    print(f"     - Subscription ID: {subscription.id}")
    
    if dry_run:
        print("   🔍 DRY RUN - Would make these changes:")
        print(f"     1. Update credit_accounts:")
        print(f"        - tier: {credit_account['tier']} → {correct_tier}")
        print(f"        - stripe_subscription_id: {credit_account.get('stripe_subscription_id')} → {subscription.id}")
        print(f"        - trial_status: {credit_account.get('trial_status')} → none")
        if hasattr(subscription, 'current_period_start') and hasattr(subscription, 'current_period_end'):
            print(f"        - billing_cycle_anchor: → {datetime.fromtimestamp(subscription.current_period_start)}")
            print(f"        - next_credit_grant: → {datetime.fromtimestamp(subscription.current_period_end)}")
        else:
            print(f"        - billing_cycle_anchor: → (using current time)")
            print(f"        - next_credit_grant: → (using next month)")
        print(f"     2. Grant ${monthly_credits} credits")
        print(f"     3. Create ledger entry for sync")
        return True
    
    try:
        # Calculate billing dates - use current time as fallback if not available
        if hasattr(subscription, 'current_period_start') and hasattr(subscription, 'current_period_end'):
            billing_anchor = datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc)
            next_grant = datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc)
        else:
            # Fallback to current time + 30 days
            billing_anchor = datetime.now(timezone.utc)
            next_grant = datetime.now(timezone.utc).replace(day=1, month=(datetime.now().month % 12) + 1)
            print(f"   ⚠️  Using fallback billing dates (subscription missing period info)")
        
        # Update credit account
        update_data = {
            'tier': correct_tier,
            'stripe_subscription_id': subscription.id,
            'trial_status': 'none',
            'billing_cycle_anchor': billing_anchor.isoformat(),
            'next_credit_grant': next_grant.isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        await client.from_('credit_accounts').update(update_data).eq('account_id', account_id).execute()
        print("   ✅ Updated credit_accounts table")
        
        # Handle yearly commitment if applicable
        if 'yearly' in stripe_data['price_nickname'].lower():
            existing_commitment = await client.from_('commitment_history')\
                .select('id')\
                .eq('stripe_subscription_id', subscription.id)\
                .execute()
            
            if not existing_commitment.data:
                commitment_end = billing_anchor.replace(year=billing_anchor.year + 1)
                
                await client.from_('commitment_history').insert({
                    'account_id': account_id,
                    'commitment_type': 'yearly_commitment',
                    'price_id': price_id,
                    'start_date': billing_anchor.isoformat(),
                    'end_date': commitment_end.isoformat(),
                    'stripe_subscription_id': subscription.id
                }).execute()
                
                print("   ✅ Created commitment_history record")
        
        # Grant credits
        result = await credit_manager.add_credits(
            account_id=account_id,
            amount=Decimal(str(monthly_credits)),
            is_expiring=True,
            description=f"Subscription sync: {correct_tier} tier credits",
        )
        
        if result.get('success'):
            print(f"   ✅ Granted ${monthly_credits} credits")
            print(f"      New balance: ${result.get('new_total', 0)}")
        else:
            print(f"   ❌ Failed to grant credits: {result}")
            return False
        
        # Create ledger entry
        await client.from_('credit_ledger').insert({
            'account_id': account_id,
            'amount': 0,
            'balance_after': float(result.get('new_total', 0)),
            'type': 'adjustment',
            'description': f"SYNC: Synced Stripe subscription {subscription.id} to database for {user_data['email']}"
        }).execute()
        
        print(f"   ✅ Subscription sync completed for {user_data['email']}")
        return True
        
    except Exception as e:
        print(f"   ❌ Error syncing subscription: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    parser = argparse.ArgumentParser(description='Sync Stripe subscription to database')
    parser.add_argument('--email', required=True, help='User email to sync')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    
    args = parser.parse_args()
    
    print(f"🔍 Syncing subscription for: {args.email}")
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made\n")
    
    db = DBConnection()
    client = await db.client
    
    try:
        # Find user
        user_data = await find_user_by_email(args.email, client)
        if not user_data:
            return 1
        
        # Get credit account
        credit_account = await get_credit_account(user_data['account_id'], client)
        if not credit_account:
            return 1
        
        # Find Stripe subscription
        stripe_data = await find_stripe_subscription(args.email)
        if not stripe_data:
            return 1
        
        # Sync to database
        success = await sync_subscription_to_db(user_data, credit_account, stripe_data, client, args.dry_run)
        
        if success:
            print(f"\n✅ Successfully {'simulated' if args.dry_run else 'completed'} sync for {args.email}")
            return 0
        else:
            print(f"\n❌ Failed to sync {args.email}")
            return 1
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

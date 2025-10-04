#!/usr/bin/env python3
"""
Script to check user account diagnostic information.

Usage:
    python check_user_account.py --email user@example.com
    python check_user_account.py --email biovidigal@gmail.com
"""

import asyncio
import argparse
import sys
import os
from datetime import datetime, timezone

backend_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.append(backend_dir)

from core.services.supabase import DBConnection
from core.billing.config import get_tier_by_price_id, TIERS
from core.utils.logger import logger
import stripe
from core.utils.config import config

stripe.api_key = config.STRIPE_SECRET_KEY

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

def print_subsection(title):
    """Print a subsection header."""
    print(f"\n{'-'*80}")
    print(f"  {title}")
    print(f"{'-'*80}")

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
        return None
        
    return result.data[0]

async def get_recent_ledger_entries(account_id: str, client, limit=10):
    """Get recent ledger entries."""
    result = await client.from_('credit_ledger')\
        .select('*')\
        .eq('account_id', account_id)\
        .order('created_at', desc=True)\
        .limit(limit)\
        .execute()
    
    return result.data if result.data else []

async def get_commitment_history(account_id: str, client):
    """Get commitment history."""
    result = await client.from_('commitment_history')\
        .select('*')\
        .eq('account_id', account_id)\
        .order('created_at', desc=True)\
        .execute()
    
    return result.data if result.data else []

async def find_stripe_customer(email: str):
    """Find Stripe customer."""
    try:
        customers = stripe.Customer.list(email=email, limit=10)
        
        if not customers.data:
            return None
            
        return customers.data[0]
        
    except Exception as e:
        print(f"❌ Error finding Stripe customer: {e}")
        return None

async def find_stripe_subscriptions(customer_id: str):
    """Find all Stripe subscriptions for customer."""
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            limit=100
        )
        
        return subscriptions.data if subscriptions.data else []
        
    except Exception as e:
        print(f"❌ Error finding Stripe subscriptions: {e}")
        return []

def format_datetime(dt_str):
    """Format datetime string."""
    if not dt_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    except:
        return dt_str

def format_timestamp(ts):
    """Format Unix timestamp."""
    if not ts:
        return "N/A"
    try:
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    except:
        return str(ts)

async def check_user_account(email: str, client):
    """Check user account diagnostic information."""
    
    print_section(f"USER ACCOUNT DIAGNOSTIC: {email}")
    
    # Find user
    user_data = await find_user_by_email(email, client)
    if not user_data:
        return False
    
    print(f"\n✅ User ID: {user_data['user_id']}")
    print(f"✅ Account ID: {user_data['account_id']}")
    print(f"✅ Account Name: {user_data['account_name']}")
    
    # Get credit account
    print_subsection("DATABASE: Credit Account")
    credit_account = await get_credit_account(user_data['account_id'], client)
    
    if not credit_account:
        print("❌ No credit account found")
    else:
        print(f"  Tier: {credit_account['tier']}")
        print(f"  Balance: ${credit_account['balance']}")
        print(f"  Expiring Credits: ${credit_account.get('expiring_credits', 'N/A')}")
        print(f"  Non-Expiring Credits: ${credit_account.get('non_expiring_credits', 'N/A')}")
        print(f"  Lifetime Granted: ${credit_account.get('lifetime_granted', 'N/A')}")
        print(f"  Lifetime Used: ${credit_account.get('lifetime_used', 'N/A')}")
        print(f"  Lifetime Purchased: ${credit_account.get('lifetime_purchased', 'N/A')}")
        print(f"  Trial Status: {credit_account.get('trial_status', 'N/A')}")
        print(f"  Stripe Subscription ID: {credit_account.get('stripe_subscription_id') or 'None'}")
        print(f"  Billing Cycle Anchor: {format_datetime(credit_account.get('billing_cycle_anchor'))}")
        print(f"  Next Credit Grant: {format_datetime(credit_account.get('next_credit_grant'))}")
        print(f"  Last Grant Date: {format_datetime(credit_account.get('last_grant_date'))}")
        print(f"  Commitment Type: {credit_account.get('commitment_type') or 'None'}")
        print(f"  Is Grandfathered Free: {credit_account.get('is_grandfathered_free', False)}")
        print(f"  Created At: {format_datetime(credit_account.get('created_at'))}")
        print(f"  Updated At: {format_datetime(credit_account.get('updated_at'))}")
    
    # Get recent ledger entries
    print_subsection("DATABASE: Recent Ledger Entries (Last 10)")
    ledger_entries = await get_recent_ledger_entries(user_data['account_id'], client)
    
    if not ledger_entries:
        print("  No ledger entries found")
    else:
        for i, entry in enumerate(ledger_entries, 1):
            print(f"\n  [{i}] {format_datetime(entry.get('created_at'))}")
            print(f"      Type: {entry.get('type')}")
            print(f"      Amount: ${entry.get('amount')}")
            print(f"      Balance After: ${entry.get('balance_after')}")
            print(f"      Description: {entry.get('description', 'N/A')}")
            if entry.get('model'):
                print(f"      Model: {entry.get('model')}")
            if entry.get('prompt_tokens') or entry.get('completion_tokens'):
                print(f"      Tokens: {entry.get('prompt_tokens', 0)} prompt + {entry.get('completion_tokens', 0)} completion")
    
    # Get commitment history
    print_subsection("DATABASE: Commitment History")
    commitments = await get_commitment_history(user_data['account_id'], client)
    
    if not commitments:
        print("  No commitment history found")
    else:
        for i, commitment in enumerate(commitments, 1):
            print(f"\n  [{i}] {commitment.get('commitment_type')}")
            print(f"      Price ID: {commitment.get('price_id')}")
            print(f"      Stripe Subscription: {commitment.get('stripe_subscription_id')}")
            print(f"      Start Date: {format_datetime(commitment.get('start_date'))}")
            print(f"      End Date: {format_datetime(commitment.get('end_date'))}")
            print(f"      Created At: {format_datetime(commitment.get('created_at'))}")
    
    # Check Stripe
    print_subsection("STRIPE: Customer Information")
    stripe_customer = await find_stripe_customer(email)
    
    if not stripe_customer:
        print("  ❌ No Stripe customer found")
    else:
        print(f"  ✅ Customer ID: {stripe_customer.id}")
        print(f"  Name: {stripe_customer.name or 'N/A'}")
        print(f"  Email: {stripe_customer.email}")
        print(f"  Created: {format_timestamp(stripe_customer.created)}")
        print(f"  Balance: ${stripe_customer.balance / 100:.2f}")
        print(f"  Delinquent: {stripe_customer.delinquent}")
        
        # Get subscriptions
        print_subsection("STRIPE: Subscriptions")
        subscriptions = await find_stripe_subscriptions(stripe_customer.id)
        
        if not subscriptions:
            print("  No subscriptions found")
        else:
            for i, sub in enumerate(subscriptions, 1):
                status_emoji = "✅" if sub.status == "active" else "⚠️" if sub.status == "trialing" else "❌"
                print(f"\n  [{i}] {status_emoji} {sub.id}")
                print(f"      Status: {sub.status}")
                
                # Get price info
                if sub.get('items') and sub['items'].get('data'):
                    price = sub['items']['data'][0]['price']
                    price_id = price['id']
                    nickname = price.get('nickname') or 'Unknown'
                    amount = price.get('unit_amount', 0) / 100
                    currency = price.get('currency', 'usd').upper()
                    interval = price.get('recurring', {}).get('interval', 'N/A')
                    
                    print(f"      Price: {price_id} ({nickname})")
                    print(f"      Amount: ${amount:.2f} {currency} / {interval}")
                    
                    # Check if price is recognized
                    tier_info = get_tier_by_price_id(price_id)
                    if tier_info:
                        print(f"      ✅ Recognized Tier: {tier_info.name} (${tier_info.monthly_credits} credits)")
                    else:
                        print(f"      ⚠️  Unknown price ID - not in billing config")
                
                # Billing period
                if hasattr(sub, 'current_period_start') and hasattr(sub, 'current_period_end'):
                    print(f"      Current Period: {format_timestamp(sub.current_period_start)} - {format_timestamp(sub.current_period_end)}")
                
                print(f"      Created: {format_timestamp(sub.created)}")
                
                if sub.status == 'canceled':
                    print(f"      Canceled At: {format_timestamp(sub.canceled_at)}")
                if sub.cancel_at:
                    print(f"      Will Cancel At: {format_timestamp(sub.cancel_at)}")
    
    # Analysis
    print_subsection("ANALYSIS")
    
    issues = []
    recommendations = []
    
    if credit_account and stripe_customer:
        # Check if subscription IDs match
        db_sub_id = credit_account.get('stripe_subscription_id')
        active_stripe_subs = [s for s in subscriptions if s.status == 'active']
        
        if not db_sub_id and active_stripe_subs:
            issues.append("❌ Active Stripe subscription exists but not linked in database")
            recommendations.append("Run: py sync_stripe_subscription.py --email " + email)
        
        if db_sub_id and not any(s.id == db_sub_id for s in subscriptions):
            issues.append("⚠️  Database has subscription ID that doesn't exist in Stripe")
            recommendations.append("Database may have stale subscription ID")
        
        if db_sub_id and active_stripe_subs and db_sub_id != active_stripe_subs[0].id:
            issues.append("⚠️  Database subscription ID doesn't match active Stripe subscription")
            recommendations.append("Run: py sync_stripe_subscription.py --email " + email)
        
        # Check tier consistency
        if active_stripe_subs:
            stripe_sub = active_stripe_subs[0]
            price_id = stripe_sub['items']['data'][0]['price']['id']
            tier_info = get_tier_by_price_id(price_id)
            
            if tier_info:
                expected_tier = tier_info.name
                actual_tier = credit_account['tier']
                
                if expected_tier != actual_tier:
                    issues.append(f"❌ Tier mismatch: DB={actual_tier}, Stripe={expected_tier}")
                    recommendations.append("Run: py sync_stripe_subscription.py --email " + email)
            else:
                issues.append(f"⚠️  Stripe price ID {price_id} not recognized in billing config")
                recommendations.append("Add price ID to backend/core/billing/config.py")
        
        # Check balance
        balance = float(credit_account.get('balance', 0))
        if balance <= 0 and credit_account['tier'] != 'free':
            issues.append("⚠️  Paid tier but zero balance")
            recommendations.append("User may need credit grant")
    
    if issues:
        print("\n🔍 Issues Found:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("\n✅ No issues detected - account looks healthy!")
    
    if recommendations:
        print("\n💡 Recommendations:")
        for rec in recommendations:
            print(f"  • {rec}")
    
    return True

async def main():
    parser = argparse.ArgumentParser(description='Check user account diagnostic information')
    parser.add_argument('--email', required=True, help='User email to check')
    
    args = parser.parse_args()
    
    db = DBConnection()
    client = await db.client
    
    try:
        success = await check_user_account(args.email, client)
        return 0 if success else 1
            
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
import os

# Define subscription tiers and their monthly limits (in minutes)
# All tiers share the same price_id in Stripe - they're differentiated by plan_name only
SUBSCRIPTION_TIERS: Dict[str, Dict] = {
    'Free':        {'minutes': 50},     # 50 minutes
    'Pro':         {'minutes': 300},    # 5 hours
    'Enterprise':  {'minutes': 2400}    # 40 hours
}

# Standardized price ID used for all plans (matching your Stripe config)
STRIPE_STANDARD_PRICE_ID = 'price_1RGtkVG23sSyONuF8kQcAclk'

async def get_account_subscription(client, account_id: str) -> Optional[Dict]:
    """Get the current subscription for an account."""
    try:
        # Try to access subscriptions in public schema first (our primary storage location)
        subscription_result = await client.from_('billing_subscriptions')\
            .select('price_id,plan_name,status')\
            .eq('account_id', account_id)\
            .eq('status', 'active')\
            .order('created_at', desc=True)\
            .limit(1)\
            .execute()
         
        if subscription_result.data and len(subscription_result.data) > 0:
            plan_name = subscription_result.data[0].get('plan_name', '').split()[0]  # Get base name
            # Find matching tier or default to Free
            tier_info = SUBSCRIPTION_TIERS.get(plan_name, SUBSCRIPTION_TIERS['Free'])
            return {
                'price_id': subscription_result.data[0].get('price_id', STRIPE_STANDARD_PRICE_ID),
                'plan_name': plan_name,
                'minutes': tier_info['minutes']
            }
         
        # As fallback, check basejump schema
        try:
            subscription_result = await client.schema('basejump')\
                .from_('billing_subscriptions')\
                .select('price_id,plan_name,status')\
                .eq('account_id', account_id)\
                .eq('status', 'active')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            if subscription_result.data and len(subscription_result.data) > 0:
                plan_name = subscription_result.data[0].get('plan_name', '').split()[0]
                tier_info = SUBSCRIPTION_TIERS.get(plan_name, SUBSCRIPTION_TIERS['Free'])
                return {
                    'price_id': subscription_result.data[0].get('price_id', STRIPE_STANDARD_PRICE_ID),
                    'plan_name': plan_name,
                    'minutes': tier_info['minutes']
                }
        except Exception as e:
            from utils.logger import logger
            logger.warning(f"Error checking basejump schema: {str(e)}")
         
        # If no subscription found, return free tier
        from utils.logger import logger
        logger.info(f"No subscription found for account {account_id}, using free tier")
        return {
            'price_id': STRIPE_STANDARD_PRICE_ID,
            'plan_name': 'Free',
            'minutes': SUBSCRIPTION_TIERS['Free']['minutes']
        }
    except Exception as e:
        # Log the error but continue with free tier
        from utils.logger import logger
        logger.warning(f"Error fetching subscription: {str(e)}, using free tier")
        return {
            'price_id': STRIPE_STANDARD_PRICE_ID,
            'plan_name': 'Free (Error)',
            'minutes': SUBSCRIPTION_TIERS['Free']['minutes']
        }

async def calculate_monthly_usage(client, account_id: str) -> float:
    """Calculate total agent run minutes for the current month for an account."""
    # Get start of current month in UTC
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # First get all threads for this account
    try:
        # Try to get threads from public schema
        threads_result = await client.schema('public').from_('threads').select('thread_id').eq('account_id', account_id).execute()
         
        # If no results, try basejump schema
        if not threads_result.data:
            threads_result = await client.schema('basejump').from_('threads').select('thread_id').eq('account_id', account_id).execute()
     
        if not threads_result.data:
            return 0.0
     
        thread_ids = [t['thread_id'] for t in threads_result.data]
     
        # Then get all agent runs for these threads in current month
        try:
            # Try public schema
            runs_result = await client.schema('public').from_('agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', start_of_month.isoformat()).execute()
             
            # If no results, try basejump schema
            if not runs_result.data:
                runs_result = await client.schema('basejump').from_('agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', start_of_month.isoformat()).execute()
        except Exception as e:
            from utils.logger import logger
            logger.warning(f"Error fetching agent runs: {str(e)}")
            return 0.0
    
        if not runs_result.data:
            return 0.0
    
        # Calculate total minutes
        total_seconds = 0
        now_ts = now.timestamp()
        
        for run in runs_result.data:
            start_time = datetime.fromisoformat(run['started_at'].replace('Z', '+00:00')).timestamp()
            if run['completed_at']:
                end_time = datetime.fromisoformat(run['completed_at'].replace('Z', '+00:00')).timestamp()
            else:
                # For running jobs, use current time
                end_time = now_ts
        
            total_seconds += (end_time - start_time)
    
        return total_seconds / 60  # Convert to minutes
    except Exception as e:
        from utils.logger import logger
        logger.warning(f"Error calculating monthly usage: {str(e)}")
        return 0.0

async def check_billing_status(client, account_id: str) -> Tuple[bool, str, Optional[Dict]]:
    """
    Check if an account can run agents based on their subscription and usage.
    
    Returns:
        Tuple[bool, str, Optional[Dict]]: (can_run, message, subscription_info)
    """
    # Get current subscription
    subscription = await get_account_subscription(client, account_id)
    
    # If no subscription, they can use free tier
    if not subscription:
        subscription = {
            'price_id': STRIPE_STANDARD_PRICE_ID,
            'plan_name': 'Free',
            'minutes': SUBSCRIPTION_TIERS['Free']['minutes']
        }
    
    # Get tier info
    tier_info = SUBSCRIPTION_TIERS.get(subscription['plan_name'], {'minutes': 0})
    
    # Calculate current month's usage
    current_usage = await calculate_monthly_usage(client, account_id)
    
    # Check if within limits
    if current_usage >= tier_info['minutes']:
        return False, f"Monthly limit of {tier_info['minutes']} minutes reached. Please upgrade your plan or wait until next month.", subscription
    elif subscription['plan_name'] == 'Free' and current_usage >= 45:
        # Still allow usage but return a warning message
        return True, f"You've used {current_usage:.1f} minutes out of your {tier_info['minutes']} minute monthly limit. Consider upgrading your plan.", subscription
    
    return True, "OK", subscription

# Helper function to get account ID from thread
async def get_account_id_from_thread(client, thread_id: str) -> Optional[str]:
    """Get the account ID associated with a thread."""
    try:
        # Try public schema first
        result = await client.from_('threads').select('account_id').eq('thread_id', thread_id).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]['account_id']
        
        # If not found, try basejump schema
        result = await client.from_('basejump.threads').select('account_id').eq('thread_id', thread_id).limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]['account_id']
    except Exception as e:
        from utils.logger import logger
        logger.warning(f"Error getting account ID from thread: {str(e)}")
        
    return None

from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

# Define subscription tiers and their monthly limits (in minutes)
SUBSCRIPTION_TIERS = {
    'price_1RGJ9GG6l1KZGqIroxSqgphC': {'name': 'free', 'minutes': 50},
    'price_1RGJ9LG6l1KZGqIrd9pwzeNW': {'name': 'base', 'minutes': 300},  # 100 hours = 6000 minutes
    'price_1RGJ9JG6l1KZGqIrVUU4ZRv6': {'name': 'extra', 'minutes': 2400}  # 100 hours = 6000 minutes
}

async def get_account_subscription(client, account_id: str) -> Optional[Dict]:
    """Get the current subscription for an account."""
    try:
        # Try to access the basejump schema directly
        subscription_result = await client.from_('basejump.billing_subscriptions').select('price_id,plan_name').eq('account_id', account_id).order('created_at', desc=True).limit(1).execute()
        
        if subscription_result.data and len(subscription_result.data) > 0:
            return subscription_result.data[0]
        
        # If no subscription found, return free tier
        return {
            'price_id': 'price_1RGJ9GG6l1KZGqIroxSqgphC',  # Free tier
            'plan_name': 'Free'
        }
    except Exception as e:
        # Log the error but continue with free tier
        from utils.logger import logger
        logger.warning(f"Error fetching subscription: {str(e)}")
        
    return None

async def calculate_monthly_usage(client, account_id: str) -> float:
    """Calculate total agent run minutes for the current month for an account."""
    # Get start of current month in UTC
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # First get all threads for this account
    try:
        # Try to get threads from public schema first
        threads_result = await client.from_('threads').select('thread_id').eq('account_id', account_id).execute()
        
        # If no results, try basejump schema
        if not threads_result.data:
            threads_result = await client.from_('basejump.threads').select('thread_id').eq('account_id', account_id).execute()
    
        if not threads_result.data:
            return 0.0
    
        thread_ids = [t['thread_id'] for t in threads_result.data]
    
        # Then get all agent runs for these threads in current month
        try:
            # Try public schema first
            runs_result = await client.from_('agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', start_of_month.isoformat()).execute()
            
            # If no results, try basejump schema
            if not runs_result.data:
                runs_result = await client.from_('basejump.agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', start_of_month.isoformat()).execute()
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
            'price_id': 'price_1RGJ9GG6l1KZGqIroxSqgphC',  # Free tier
            'plan_name': 'Free'
        }
    
    # Get tier info
    tier_info = SUBSCRIPTION_TIERS.get(subscription['price_id'])
    if not tier_info:
        return False, "Invalid subscription tier", subscription
    
    # Calculate current month's usage
    current_usage = await calculate_monthly_usage(client, account_id)
    
    # Check if within limits
    if current_usage >= tier_info['minutes']:
        return False, f"Monthly limit of {tier_info['minutes']} minutes reached. Please upgrade your plan or wait until next month.", subscription
    elif subscription['price_id'] == 'price_1RGJ9GG6l1KZGqIroxSqgphC' and current_usage >= 45:
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

from datetime import datetime, timezone
from typing import Dict, Optional, Tuple
import os

# Define subscription tiers and their monthly limits (in minutes)
SUBSCRIPTION_TIERS: Dict[str, Dict] = {
    'price_1RGtl4G23sSyONuFYWYsA0HK': {'name': 'free', 'minutes': 50},  # Free tier - 50 minutes
    'price_1RGtkVG23sSyONuF8kQcAclk': {'name': 'pro', 'minutes': 300},  # Pro tier - 300 minutes (5 hours)
    'price_1RGw3iG23sSyONuFGk8uD3XV': {'name': 'enterprise', 'minutes': 2400}  # Enterprise tier - 2400 minutes (40 hours)
}

async def get_account_subscription(client, account_id: str) -> Optional[Dict]:
    """Get the current subscription for an account."""
    try:
        # NOTE: Development mode check REMOVED to always read actual subscriptions
            
        # Try to access subscriptions in public schema first (our primary storage location)
        subscription_result = await client.from_('billing_subscriptions').select('price_id,plan_name').eq('account_id', account_id).order('created_at', desc=True).limit(1).execute()
         
        if subscription_result.data and len(subscription_result.data) > 0:
            from utils.logger import logger
            logger.info(f"Found subscription in public schema: {subscription_result.data[0]}")
            return subscription_result.data[0]
         
        # As fallback, check basejump schema
        try:
            subscription_result = await client.schema('basejump').from_('billing_subscriptions').select('price_id,plan_name').eq('account_id', account_id).order('created_at', desc=True).limit(1).execute()
            
            if subscription_result.data and len(subscription_result.data) > 0:
                from utils.logger import logger
                logger.info(f"Found subscription in basejump schema: {subscription_result.data[0]}")
                return subscription_result.data[0]
        except Exception as e:
            from utils.logger import logger
            logger.warning(f"Error checking basejump schema: {str(e)}")
         
        # If no subscription found, return free tier
        from utils.logger import logger
        logger.info(f"No subscription found for account {account_id}, using free tier")
        return {
            'price_id': 'price_1RGtl4G23sSyONuFYWYsA0HK',  # Free tier
            'plan_name': 'Free'
        }
    except Exception as e:
        # Log the error but continue with free tier
        from utils.logger import logger
        logger.warning(f"Error fetching subscription: {str(e)}, using free tier")
        return {
            'price_id': 'price_1RGtl4G23sSyONuFYWYsA0HK',  # Free tier
            'plan_name': 'Free (Error)'
        }

async def calculate_monthly_usage(client, account_id: str) -> float:
    """Calculate total agent run minutes for the current month for an account."""
    # Calculate first day of current month
    now = datetime.now(timezone.utc)
    first_day = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    # First get all threads for this account
    try:
        # Try to get threads from public schema
        threads_result = await client.schema('public').from_('threads').select('thread_id').eq('account_id', account_id).execute()
        
        thread_ids = [thread['thread_id'] for thread in threads_result.data] if threads_result.data else []
        
        # If no threads found, try basejump schema
        if not thread_ids:
            try:
                threads_result = await client.schema('basejump').from_('threads').select('thread_id').eq('account_id', account_id).execute()
                thread_ids = [thread['thread_id'] for thread in threads_result.data] if threads_result.data else []
            except Exception as e:
                from utils.logger import logger
                logger.warning(f"Error fetching threads from basejump schema: {str(e)}")
        
        # If still no threads, return 0 usage
        if not thread_ids:
            return 0.0
        
        # Get agent runs for these threads in the current month
        agent_runs_result = await client.schema('public').from_('agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', first_day.isoformat()).execute()
        
        # If no agent runs in public schema, try basejump schema
        if not agent_runs_result.data:
            try:
                agent_runs_result = await client.schema('basejump').from_('agent_runs').select('started_at,completed_at').in_('thread_id', thread_ids).gte('started_at', first_day.isoformat()).execute()
            except Exception as e:
                from utils.logger import logger
                logger.warning(f"Error fetching agent runs from basejump schema: {str(e)}")
        
        # Calculate total run time in minutes
        total_minutes = 0.0
        for run in agent_runs_result.data if agent_runs_result.data else []:
            start_time = datetime.fromisoformat(run['started_at'].replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(run['completed_at'].replace('Z', '+00:00')) if run['completed_at'] else datetime.now(timezone.utc)
            duration_minutes = (end_time - start_time).total_seconds() / 60
            total_minutes += duration_minutes
        
        from utils.logger import logger
        logger.info(f"Total usage for account {account_id} this month: {total_minutes:.2f} minutes")
        return total_minutes
    
    except Exception as e:
        from utils.logger import logger
        logger.error(f"Error calculating monthly usage: {str(e)}")
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
            'price_id': 'price_1RGtl4G23sSyONuFYWYsA0HK',  # Free tier
            'plan_name': 'Free',
            'minutes': SUBSCRIPTION_TIERS['price_1RGtl4G23sSyONuFYWYsA0HK']['minutes']
        }
    
    # Get tier info
    tier_info = SUBSCRIPTION_TIERS.get(subscription['price_id'], {'minutes': 0})
    
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

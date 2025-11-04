"""
Admin script to manually grant free tier credits to accounts stuck with tier='none'
Run this to fix accounts that signed up but didn't get initialized properly
"""

from fastapi import APIRouter, Depends, HTTPException
from core.utils.auth_utils import verify_and_get_user_id_from_jwt
from core.utils.logger import logger
from core.billing.free_tier_service import free_tier_service
from core.services.supabase import DBConnection
from decimal import Decimal

router = APIRouter(prefix="/admin/fix", tags=["admin"])

@router.post("/grant-free-tier-credits")
async def grant_free_tier_credits(
    account_id: str = Depends(verify_and_get_user_id_from_jwt)
):
    """
    Manually grant free tier credits to an account
    This is a temporary fix for accounts that got stuck during signup
    """
    try:
        db = DBConnection()
        client = await db.client
        
        logger.info(f"[ADMIN FIX] Checking account {account_id}")
        
        # Check current account status
        account_check = await client.from_('credit_accounts').select(
            'tier, balance, stripe_subscription_id'
        ).eq('account_id', account_id).single().execute()
        
        if not account_check.data:
            raise HTTPException(status_code=404, detail="Account not found")
        
        account = account_check.data
        logger.info(f"[ADMIN FIX] Account status: tier={account['tier']}, balance={account['balance']}, has_sub={bool(account['stripe_subscription_id'])}")
        
        # If account has tier='none' or balance=0, try to initialize
        if account['tier'] == 'none' or float(account['balance']) == 0:
            logger.info(f"[ADMIN FIX] Account needs initialization, calling free_tier_service")
            
            # Get user email
            account_result = await client.schema('basejump').from_('accounts').select(
                'primary_owner_user_id'
            ).eq('id', account_id).single().execute()
            
            if account_result.data:
                user_id = account_result.data['primary_owner_user_id']
                try:
                    user_result = await client.auth.admin.get_user_by_id(user_id)
                    email = user_result.user.email if user_result and user_result.user else None
                except:
                    email = None
                
                # Call free tier service to set up subscription and grant credits
                result = await free_tier_service.auto_subscribe_to_free_tier(account_id, email)
                
                if result.get('success'):
                    logger.info(f"[ADMIN FIX] ✅ Successfully granted free tier to {account_id}")
                    return {
                        'success': True,
                        'message': 'Free tier credits granted successfully',
                        'subscription_id': result.get('subscription_id'),
                        'credits_granted': 2.0
                    }
                else:
                    # If subscription already exists but no credits, manually grant them
                    if result.get('message') == 'Already subscribed':
                        logger.info(f"[ADMIN FIX] Subscription exists, manually granting credits")
                        
                        FREE_TIER_INITIAL_CREDITS = Decimal('2.00')
                        
                        # Update balance
                        await client.from_('credit_accounts').update({
                            'tier': 'free',
                            'balance': float(FREE_TIER_INITIAL_CREDITS),
                            'non_expiring_credits': float(FREE_TIER_INITIAL_CREDITS),
                            'last_grant_date': 'now()'
                        }).eq('account_id', account_id).execute()
                        
                        # Create ledger entry
                        await client.from_('credit_ledger').insert({
                            'account_id': account_id,
                            'amount': float(FREE_TIER_INITIAL_CREDITS),
                            'balance_after': float(FREE_TIER_INITIAL_CREDITS),
                            'type': 'tier_grant',
                            'description': 'Welcome to Machine! Free tier initial credits (admin grant)'
                        }).execute()
                        
                        logger.info(f"[ADMIN FIX] ✅ Manually granted {FREE_TIER_INITIAL_CREDITS} credits to {account_id}")
                        return {
                            'success': True,
                            'message': 'Credits granted successfully (manual)',
                            'credits_granted': float(FREE_TIER_INITIAL_CREDITS)
                        }
                    else:
                        raise HTTPException(status_code=500, detail=result.get('error', 'Unknown error'))
        else:
            return {
                'success': True,
                'message': 'Account already has credits',
                'tier': account['tier'],
                'balance': account['balance']
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ADMIN FIX] Error granting credits to {account_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

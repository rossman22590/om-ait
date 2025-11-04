from typing import Dict, Optional
import stripe
from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.logger import logger
from .config import FREE_TIER_INITIAL_CREDITS

class FreeTierService:
    def __init__(self):
        self.stripe = stripe
        
    async def auto_subscribe_to_free_tier(self, account_id: str, email: Optional[str] = None) -> Dict:
        db = DBConnection()
        client = await db.client
        
        try:
            logger.info(f"[FREE TIER] Auto-subscribing user {account_id} to free tier")
            
            existing_sub = await client.from_('credit_accounts').select(
                'stripe_subscription_id, tier, balance'
            ).eq('account_id', account_id).execute()
            
            if existing_sub.data and len(existing_sub.data) > 0:
                credit_account = existing_sub.data[0]
                existing_subscription_id = credit_account.get('stripe_subscription_id')
                existing_balance = float(credit_account.get('balance', 0))
                
                # If they have subscription and credits, they're all set
                if existing_subscription_id and existing_balance > 0:
                    logger.info(f"[FREE TIER] User {account_id} already has subscription with credits, skipping")
                    return {'success': True, 'message': 'Already subscribed', 'subscription_id': existing_subscription_id}
                
                # If they have subscription but no credits, grant credits
                if existing_subscription_id and existing_balance == 0:
                    logger.info(f"[FREE TIER] User {account_id} has subscription but no credits, granting credits")
                    await client.from_('credit_accounts').update({
                        'tier': 'free',
                        'balance': float(FREE_TIER_INITIAL_CREDITS),
                        'non_expiring_credits': float(FREE_TIER_INITIAL_CREDITS),
                        'last_grant_date': 'now()'
                    }).eq('account_id', account_id).execute()
                    
                    await client.from_('credit_ledger').insert({
                        'account_id': account_id,
                        'amount': float(FREE_TIER_INITIAL_CREDITS),
                        'balance_after': float(FREE_TIER_INITIAL_CREDITS),
                        'type': 'tier_grant',
                        'description': 'Welcome to Machine! Free tier initial credits'
                    }).execute()
                    
                    logger.info(f"[FREE TIER] ✅ Granted ${FREE_TIER_INITIAL_CREDITS} credits to existing subscription {existing_subscription_id}")
                    return {'success': True, 'subscription_id': existing_subscription_id}
            
            customer_result = await client.schema('basejump').from_('billing_customers').select(
                'id'
            ).eq('account_id', account_id).execute()
            
            stripe_customer_id = customer_result.data[0]['id'] if customer_result.data and len(customer_result.data) > 0 else None
            
            if not email:
                account_result = await client.schema('basejump').from_('accounts').select(
                    'primary_owner_user_id'
                ).eq('id', account_id).execute()
                
                if account_result.data and len(account_result.data) > 0:
                    user_id = account_result.data[0]['primary_owner_user_id']
                    try:
                        user_result = await client.auth.admin.get_user_by_id(user_id)
                        email = user_result.user.email if user_result and user_result.user else None
                    except:
                        pass
                    
                    if not email:
                        try:
                            email_result = await client.rpc('get_user_email', {'user_id': user_id}).execute()
                            if email_result.data:
                                email = email_result.data
                        except:
                            pass
            
            if not email:
                logger.error(f"[FREE TIER] Could not get email for account {account_id}")
                return {'success': False, 'error': 'Email not found'}
            
            if not stripe_customer_id:
                logger.info(f"[FREE TIER] Creating Stripe customer for {account_id}")
                customer = await self.stripe.Customer.create_async(
                    email=email,
                    metadata={'account_id': account_id},
                    invoice_settings={
                        'default_payment_method': None
                    }
                )
                stripe_customer_id = customer.id
                
                await client.schema('basejump').from_('billing_customers').insert({
                    'id': stripe_customer_id,
                    'account_id': account_id,
                    'email': email
                }).execute()
            
            logger.info(f"[FREE TIER] Creating $0/month subscription for {account_id}")
            subscription = await self.stripe.Subscription.create_async(
                customer=stripe_customer_id,
                items=[{'price': config.STRIPE_FREE_TIER_ID}],
                collection_method='charge_automatically',
                days_until_due=None,
                metadata={
                    'account_id': account_id,
                    'tier': 'free'
                }
            )
            
            # Update credit account with subscription and grant initial credits
            await client.from_('credit_accounts').update({
                'tier': 'free',
                'stripe_subscription_id': subscription.id,
                'balance': float(FREE_TIER_INITIAL_CREDITS),
                'non_expiring_credits': float(FREE_TIER_INITIAL_CREDITS),
                'last_grant_date': 'now()'
            }).eq('account_id', account_id).execute()
            
            # Create ledger entry for the initial credit grant
            await client.from_('credit_ledger').insert({
                'account_id': account_id,
                'amount': float(FREE_TIER_INITIAL_CREDITS),
                'balance_after': float(FREE_TIER_INITIAL_CREDITS),
                'type': 'tier_grant',
                'description': 'Welcome to Machine! Free tier initial credits'
            }).execute()
            
            logger.info(f"[FREE TIER] ✅ Successfully created free tier subscription {subscription.id} for {account_id} with ${FREE_TIER_INITIAL_CREDITS} credits")
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'customer_id': stripe_customer_id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"[FREE TIER] Stripe error for {account_id}: {e}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"[FREE TIER] Error auto-subscribing {account_id}: {e}")
            return {'success': False, 'error': str(e)}

free_tier_service = FreeTierService()


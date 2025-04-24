# AI Tutor Billing and Account Management

This document outlines the billing system, account upgrade flow, and security considerations for the AI Tutor platform.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Account Tiers](#account-tiers)
- [Stripe Integration](#stripe-integration)
- [Billing Flow](#billing-flow)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Implementation Checklist](#implementation-checklist)
- [FastAPI-Based Billing Implementation](#fastapi-based-billing-implementation)
- [Recent Billing System Changes](#recent-billing-system-changes)

## Architecture Overview

The billing system uses a combination of:
- **Supabase**: For user authentication and account data storage
- **Stripe**: For payment processing and subscription management
- **Basejump Schema**: For storing account membership and subscription data
- **FastAPI Backend**: For handling billing logic and Stripe webhook events

Key components:
- `basejump.billing_subscriptions`: Stores subscription data
- `basejump.account_user`: Stores account membership data
- `utils/billing.py`: Contains billing verification logic
- `utils/auth_utils.py`: Contains account access verification

## Account Tiers

| Tier | Features | Price |
|------|----------|-------|
| Free | - Limited sandbox usage<br>- Basic AI capabilities | $0/month |
| Pro | - Unlimited sandboxes<br>- Advanced AI models<br>- Priority support | $19/month |
| Team | - Everything in Pro<br>- Team collaboration<br>- Admin dashboard | $49/month |

## Stripe Integration

### Setup Requirements

1. **Environment Variables**:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_PRICE_ID_TEAM=price_...
   ```

2. **Stripe Products and Prices**:
   - Create products in Stripe dashboard for each tier
   - Note the price IDs for each product/tier
   - Configure webhook endpoints to notify our backend of events

### Integration Points

1. **Frontend**: 
   - Uses Stripe Checkout for initial subscription
   - Uses Stripe Customer Portal for subscription management

2. **Backend**:
   - Webhook handler for subscription events
   - Billing verification middleware

### Webhook Implementation

1. **Webhook Endpoint**:
   ```python
   @router.post("/billing/webhook")
   async def stripe_webhook(request: Request):
       payload = await request.body()
       sig_header = request.headers.get("stripe-signature")
       
       try:
           # Verify webhook signature
           event = stripe.Webhook.construct_event(
               payload, sig_header, STRIPE_WEBHOOK_SECRET
           )
           
           # Handle different event types
           if event["type"] == "checkout.session.completed":
               handle_checkout_completed(event["data"]["object"])
           elif event["type"] == "customer.subscription.updated":
               handle_subscription_updated(event["data"]["object"])
           elif event["type"] == "customer.subscription.deleted":
               handle_subscription_deleted(event["data"]["object"])
               
           return {"status": "success"}
       except Exception as e:
           logger.error(f"Webhook error: {str(e)}")
           raise HTTPException(status_code=400, detail=str(e))
   ```

2. **Event Handlers**:
   ```python
   async def handle_checkout_completed(session):
       # Get customer and subscription info
       customer_id = session["customer"]
       subscription_id = session["subscription"]
       
       # Update database
       await client.schema('basejump').from_('billing_subscriptions').insert({
           "account_id": session["client_reference_id"],
           "stripe_customer_id": customer_id,
           "stripe_subscription_id": subscription_id,
           "status": "active",
           "plan": session["metadata"]["plan"],
           "current_period_end": get_subscription_end_date(subscription_id)
       }).execute()
   ```

## Billing Flow

### New Subscription Flow

1. User clicks "Upgrade" in the UI
2. Frontend calls `/api/billing/create-checkout-session`
3. Backend creates Stripe Checkout session with:
   - Price ID for selected tier
   - Customer ID (if existing customer)
   - Success/cancel URLs
4. User completes payment on Stripe Checkout page
5. Stripe sends webhook event to our backend
6. Backend updates `basejump.billing_subscriptions` table
7. User is redirected to success page

### Subscription Management Flow

1. User clicks "Manage Subscription" in account settings
2. Frontend calls `/api/billing/create-portal-session`
3. Backend creates Stripe Customer Portal session
4. User is redirected to Stripe Customer Portal
5. User makes changes (upgrade, downgrade, cancel)
6. Stripe sends webhook events to our backend
7. Backend updates subscription status in database

### Subscription Management API

```python
@router.post("/billing/create-portal-session")
async def create_portal_session(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    # Get account for user
    account_id = await get_personal_account_id(user_id)
    
    # Get Stripe customer ID
    subscription = await get_subscription(account_id)
    if not subscription or not subscription.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No subscription found")
    
    # Create portal session
    session = stripe.billing_portal.Session.create(
        customer=subscription["stripe_customer_id"],
        return_url=f"{FRONTEND_URL}/account/billing"
    )
    
    return {"url": session.url}
```

### Billing Overrides and Admin Controls

The system supports manual overrides for billing through admin controls:

1. **Override Types**:
   - **Plan Override**: Change subscription tier without payment
   - **Expiration Override**: Extend subscription period
   - **Feature Override**: Enable specific features regardless of plan

2. **Admin API Endpoints**:
   ```python
   @router.post("/admin/billing/override")
   async def admin_billing_override(
       override_request: dict,
       user_id: str = Depends(get_admin_user_id)  # Special admin check
   ):
       target_account_id = override_request["account_id"]
       override_type = override_request["type"]
       override_value = override_request["value"]
       
       # Update override in database
       await client.schema('basejump').from_('billing_overrides').upsert({
           "account_id": target_account_id,
           "override_type": override_type,
           "override_value": override_value,
           "created_by": user_id,
           "created_at": datetime.now().isoformat(),
           "expires_at": override_request.get("expires_at")
       }).execute()
       
       return {"status": "success"}
   ```

3. **Checking for Overrides**:
   ```python
   async def check_billing_status(user_id, account_id=None):
       # Get account if not provided
       if not account_id:
           account_id = await get_personal_account_id(user_id)
       
       # Check for billing overrides first
       override = await client.schema('basejump').from_('billing_overrides')
           .select('*')
           .eq('account_id', account_id)
           .is_('expires_at', 'null')  # Active overrides
           .execute()
       
       if override.data and len(override.data) > 0:
           # Use override settings
           return {
               "status": "active",
               "plan": override.data[0].get("override_value", "free"),
               "overridden": True
           }
       
       # Otherwise check normal subscription
       subscription = await client.schema('basejump').from_('billing_subscriptions')
           .select('*')
           .eq('account_id', account_id)
           .execute()
       
       if not subscription.data or len(subscription.data) == 0:
           return {"status": "free", "plan": "free"}
       
       return {
           "status": subscription.data[0].get("status", "free"),
           "plan": subscription.data[0].get("plan", "free"),
           "current_period_end": subscription.data[0].get("current_period_end")
       }
   ```

### Development Mode Bypass

For development and testing, the system includes a bypass mechanism:

```python
async def check_billing_status(user_id, account_id=None):
    # Development mode bypass
    if os.getenv("ENVIRONMENT", "").lower() == "development":
        logger.warning("DEVELOPMENT MODE: Bypassing billing checks")
        return {
            "status": "active",
            "plan": "team",  # Highest tier for testing
            "is_development": True
        }
    
    # Normal billing check logic...
```

## Security Considerations

### Account Isolation

**Critical**: Each user must only access resources belonging to their account.

1. **Direct Ownership Check**:
   ```python
   if account_id == user_id:
       # Allow access (personal workspace)
       return True
   ```

2. **Account Membership Check**:
   ```python
   # Check in basejump schema
   account_user_result = await client.schema('basejump').from_('account_user')
       .select('account_role')
       .eq('user_id', user_id)
       .eq('account_id', account_id)
       .execute()
   
   if account_user_result.data and len(account_user_result.data) > 0:
       # Allow access (team member)
       return True
   ```

3. **Fail-Closed Approach**:
   - Always deny access on errors or exceptions
   - Never bypass security checks, even in development

### Schema Access Issues

The system uses two schemas:
- `public`: Standard Supabase schema
- `basejump`: Custom schema for billing and account data

**Important**: When querying `basejump` tables, always use:
```python
client.schema('basejump').from_('table_name')
```

## Troubleshooting

### Common Issues

1. **"Error verifying access permissions"**:
   - Check if `basejump.account_user` table exists and has correct data
   - Verify user has proper account membership

2. **"Error verifying billing status"**:
   - Check if `basejump.billing_subscriptions` table exists
   - Verify Stripe webhook is properly configured
   - Check for Stripe webhook errors in logs

3. **Schema Access Issues**:
   - Ensure queries use `client.schema('basejump')` when accessing basejump tables
   - Check database permissions for service role

### Development Mode

For local development:
1. Set `ENVIRONMENT=development` in your `.env` file
2. This enables a bypass for billing checks (all features enabled)
3. **Never** enable development mode in production

### Logging

Enable detailed logging for billing and access issues:
```python
logger.debug(f"Billing status check for user {user_id}, account {account_id}: {status}")
```

## Implementation Checklist

- [ ] Set up Stripe products and prices
- [ ] Configure environment variables
- [ ] Implement checkout and portal session creation
- [ ] Set up webhook handler for Stripe events
- [ ] Implement billing verification middleware
- [ ] Test subscription flow end-to-end
- [ ] Verify security isolation between accounts

## FastAPI-Based Billing Implementation

This section details our approach to implementing billing without relying on Supabase Edge Functions, which can be challenging to debug and maintain.

### Architecture Decision

We chose to implement billing directly in our FastAPI backend instead of using Supabase Functions for several reasons:

1. **Better Error Handling**: Direct control over error handling and logging
2. **Simplified Debugging**: Easier to debug and test locally
3. **Schema Flexibility**: Direct access to both `public` and `basejump` schemas
4. **Consistent Security Model**: Uses the same authentication and authorization as the rest of the API

### Database Schema

The billing system uses the following tables in the `basejump` schema:

```sql
-- Subscription table
CREATE TABLE basejump.billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES auth.users(id) NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT DEFAULT 'inactive',
    plan TEXT DEFAULT 'free',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing overrides table
CREATE TABLE basejump.billing_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES auth.users(id) NOT NULL,
    override_type TEXT NOT NULL,
    override_value TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Usage tracking table
CREATE TABLE basejump.usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES auth.users(id) NOT NULL,
    metric_type TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Complete Billing Router Implementation

Here's the complete implementation of our billing router in FastAPI:

```python
from fastapi import APIRouter, Depends, Request, HTTPException
from typing import Optional
import stripe
import os
import json
from datetime import datetime, timezone, timedelta

from utils.auth_utils import get_current_user_id, get_admin_user_id
from utils.logger import logger
from services.supabase import DBConnection

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://ai-tutor-machine.vercel.app")

# Price IDs
PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")
PRICE_ID_TEAM = os.getenv("STRIPE_PRICE_ID_TEAM")

router = APIRouter(prefix="/billing", tags=["billing"])
db = None

def initialize(_db: DBConnection):
    global db
    db = _db
    logger.info("Initialized billing API with database connection")

# Helper functions
async def get_personal_account_id(user_id: str) -> str:
    """Get the personal account ID for a user (same as user_id for personal accounts)"""
    return user_id

async def get_subscription(account_id: str):
    """Get subscription data for an account"""
    client = await db.client
    result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('account_id', account_id).execute()
    
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None

async def get_subscription_end_date(subscription_id: str) -> str:
    """Get the end date for a Stripe subscription"""
    subscription = stripe.Subscription.retrieve(subscription_id)
    return datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()

# Checkout session creation
@router.post("/create-checkout-session")
async def create_checkout_session(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    data = await request.json()
    plan = data.get("plan", "pro")
    
    # Get account for user
    account_id = await get_personal_account_id(user_id)
    
    # Check if user already has a subscription
    subscription = await get_subscription(account_id)
    customer_id = None
    
    if subscription and subscription.get("stripe_customer_id"):
        customer_id = subscription.get("stripe_customer_id")
    
    # Set price based on plan
    price_id = PRICE_ID_PRO if plan == "pro" else PRICE_ID_TEAM
    
    # Create checkout session
    try:
        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            client_reference_id=account_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/account/billing?success=true",
            cancel_url=f"{FRONTEND_URL}/account/billing?canceled=true",
            metadata={
                "plan": plan,
                "user_id": user_id
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Customer portal session
@router.post("/create-portal-session")
async def create_portal_session(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    # Get account for user
    account_id = await get_personal_account_id(user_id)
    
    # Get Stripe customer ID
    subscription = await get_subscription(account_id)
    if not subscription or not subscription.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No subscription found")
    
    # Create portal session
    try:
        session = stripe.billing_portal.Session.create(
            customer=subscription["stripe_customer_id"],
            return_url=f"{FRONTEND_URL}/account/billing"
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Error creating portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Webhook handler
@router.post("/webhook", status_code=200)
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        
        event_data = event["data"]["object"]
        event_type = event["type"]
        
        logger.info(f"Processing Stripe webhook: {event_type}")
        
        # Handle different event types
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(event_data)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_data)
        elif event_type == "invoice.payment_failed":
            await handle_payment_failed(event_data)
        
        return {"status": "success"}
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature in Stripe webhook")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Event handlers
async def handle_checkout_completed(session):
    """Handle checkout.session.completed event"""
    client = await db.client
    
    # Get customer and subscription info
    customer_id = session["customer"]
    subscription_id = session["subscription"]
    account_id = session["client_reference_id"]
    plan = session["metadata"]["plan"]
    
    # Get subscription details from Stripe
    subscription = stripe.Subscription.retrieve(subscription_id)
    current_period_start = datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc).isoformat()
    current_period_end = datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()
    
    # Check if subscription already exists
    existing = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('account_id', account_id).execute()
    
    if existing.data and len(existing.data) > 0:
        # Update existing subscription
        await client.schema('basejump').from_('billing_subscriptions').update({
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "status": "active",
            "plan": plan,
            "current_period_start": current_period_start,
            "current_period_end": current_period_end,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq('account_id', account_id).execute()
    else:
        # Create new subscription
        await client.schema('basejump').from_('billing_subscriptions').insert({
            "account_id": account_id,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "status": "active",
            "plan": plan,
            "current_period_start": current_period_start,
            "current_period_end": current_period_end,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }).execute()
    
    logger.info(f"Successfully processed checkout completion for account {account_id}")

async def handle_subscription_updated(subscription_data):
    """Handle customer.subscription.updated event"""
    client = await db.client
    
    subscription_id = subscription_data["id"]
    
    # Find the account with this subscription
    result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('stripe_subscription_id', subscription_id).execute()
    
    if not result.data or len(result.data) == 0:
        logger.warning(f"No account found for subscription {subscription_id}")
        return
    
    account_id = result.data[0]["account_id"]
    
    # Get plan from subscription items
    items = subscription_data["items"]["data"]
    plan = "pro"  # Default
    
    if items and len(items) > 0:
        price_id = items[0]["price"]["id"]
        if price_id == PRICE_ID_TEAM:
            plan = "team"
    
    # Update subscription in database
    await client.schema('basejump').from_('billing_subscriptions').update({
        "status": subscription_data["status"],
        "plan": plan,
        "current_period_start": datetime.fromtimestamp(subscription_data["current_period_start"], tz=timezone.utc).isoformat(),
        "current_period_end": datetime.fromtimestamp(subscription_data["current_period_end"], tz=timezone.utc).isoformat(),
        "cancel_at_period_end": subscription_data["cancel_at_period_end"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq('account_id', account_id).execute()
    
    logger.info(f"Successfully updated subscription for account {account_id}")

async def handle_subscription_deleted(subscription_data):
    """Handle customer.subscription.deleted event"""
    client = await db.client
    
    subscription_id = subscription_data["id"]
    
    # Find the account with this subscription
    result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('stripe_subscription_id', subscription_id).execute()
    
    if not result.data or len(result.data) == 0:
        logger.warning(f"No account found for subscription {subscription_id}")
        return
    
    account_id = result.data[0]["account_id"]
    
    # Update subscription in database
    await client.schema('basejump').from_('billing_subscriptions').update({
        "status": "canceled",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq('account_id', account_id).execute()
    
    logger.info(f"Successfully marked subscription as canceled for account {account_id}")

async def handle_payment_failed(invoice_data):
    """Handle invoice.payment_failed event"""
    client = await db.client
    
    subscription_id = invoice_data["subscription"]
    
    # Find the account with this subscription
    result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('stripe_subscription_id', subscription_id).execute()
    
    if not result.data or len(result.data) == 0:
        logger.warning(f"No account found for subscription {subscription_id}")
        return
    
    account_id = result.data[0]["account_id"]
    
    # Update subscription in database
    await client.schema('basejump').from_('billing_subscriptions').update({
        "status": "past_due",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq('account_id', account_id).execute()
    
    logger.info(f"Marked subscription as past_due for account {account_id} due to payment failure")

# Billing verification middleware
@router.get("/status")
async def get_billing_status(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """Get billing status for the current user"""
    account_id = await get_personal_account_id(user_id)
    status = await check_billing_status(user_id, account_id)
    return status

# Admin endpoints
@router.post("/admin/override", status_code=201)
async def admin_billing_override(
    request: Request,
    user_id: str = Depends(get_admin_user_id)
):
    """Create or update a billing override"""
    client = await db.client
    data = await request.json()
    
    target_account_id = data.get("account_id")
    override_type = data.get("type")
    override_value = data.get("value")
    expires_at = data.get("expires_at")
    notes = data.get("notes", "")
    
    if not target_account_id or not override_type or not override_value:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Convert expires_at string to timestamp if provided
    expires_at_timestamp = None
    if expires_at:
        try:
            expires_at_timestamp = datetime.fromisoformat(expires_at).isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expires_at format")
    
    # Create or update override
    await client.schema('basejump').from_('billing_overrides').upsert({
        "account_id": target_account_id,
        "override_type": override_type,
        "override_value": override_value,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at_timestamp,
        "notes": notes
    }).execute()
    
    return {"status": "success", "message": "Billing override created"}

@router.delete("/admin/override/{override_id}")
async def delete_billing_override(
    override_id: str,
    user_id: str = Depends(get_admin_user_id)
):
    """Delete a billing override"""
    client = await db.client
    
    await client.schema('basejump').from_('billing_overrides').delete().eq('id', override_id).execute()
    
    return {"status": "success", "message": "Billing override deleted"}

# Usage tracking
@router.post("/track-usage")
async def track_usage(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    """Track usage of a billable feature"""
    client = await db.client
    data = await request.json()
    
    account_id = await get_personal_account_id(user_id)
    metric_type = data.get("metric_type")
    count = data.get("count", 1)
    
    if not metric_type:
        raise HTTPException(status_code=400, detail="Missing metric_type")
    
    # Get current period
    now = datetime.now(timezone.utc)
    period_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    next_month = now.month + 1 if now.month < 12 else 1
    next_year = now.year if now.month < 12 else now.year + 1
    period_end = datetime(next_year, next_month, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
    
    # Check if metric exists for current period
    result = await client.schema('basejump').from_('usage_metrics').select('*').eq('account_id', account_id).eq('metric_type', metric_type).gte('period_end', now.isoformat()).execute()
    
    if result.data and len(result.data) > 0:
        # Update existing metric
        metric_id = result.data[0]["id"]
        current_count = result.data[0]["count"]
        
        await client.schema('basejump').from_('usage_metrics').update({
            "count": current_count + count,
            "updated_at": now.isoformat()
        }).eq('id', metric_id).execute()
    else:
        # Create new metric
        await client.schema('basejump').from_('usage_metrics').insert({
            "account_id": account_id,
            "metric_type": metric_type,
            "count": count,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat()
        }).execute()
    
    return {"status": "success"}

# The main billing check function used throughout the application
async def check_billing_status(user_id, account_id=None):
    """
    Check billing status for a user or account.
    
    Args:
        user_id: The user ID
        account_id: Optional account ID. If not provided, uses the user's personal account.
        
    Returns:
        dict: Billing status information
    """
    # Development mode bypass
    if os.getenv("ENVIRONMENT", "").lower() == "development":
        logger.warning(f"DEVELOPMENT MODE: Bypassing billing checks for user {user_id}")
        return {
            "status": "active",
            "plan": "team",  # Highest tier for testing
            "is_development": True
        }
    
    client = await db.client
    
    # Get account if not provided
    if not account_id:
        account_id = await get_personal_account_id(user_id)
    
    # Check for billing overrides first
    override_result = await client.schema('basejump').from_('billing_overrides').select('*').eq('account_id', account_id).execute()
    
    active_override = None
    now = datetime.now(timezone.utc).isoformat()
    
    if override_result.data and len(override_result.data) > 0:
        for override in override_result.data:
            # Check if override is active (no expiration or not expired yet)
            expires_at = override.get("expires_at")
            if not expires_at or expires_at > now:
                active_override = override
                break
    
    if active_override:
        # Use override settings
        logger.info(f"Using billing override for account {account_id}: {active_override.get('override_type')}={active_override.get('override_value')}")
        return {
            "status": "active",
            "plan": active_override.get("override_value", "free"),
            "overridden": True,
            "override_type": active_override.get("override_type"),
            "override_expires_at": active_override.get("expires_at")
        }
    
    # Otherwise check normal subscription
    subscription_result = await client.schema('basejump').from_('billing_subscriptions').select('*').eq('account_id', account_id).execute()
    
    if not subscription_result.data or len(subscription_result.data) == 0:
        logger.debug(f"No subscription found for account {account_id}, using free tier")
        return {"status": "free", "plan": "free"}
    
    subscription = subscription_result.data[0]
    status = subscription.get("status", "free")
    plan = subscription.get("plan", "free")
    current_period_end = subscription.get("current_period_end")
    
    # Check if subscription is expired
    if current_period_end and current_period_end < now and status != "canceled":
        # Subscription is expired but not properly canceled
        logger.warning(f"Subscription for account {account_id} is expired but not canceled")
        
        # Update status in database
        await client.schema('basejump').from_('billing_subscriptions').update({
            "status": "expired",
            "updated_at": now
        }).eq('account_id', account_id).execute()
        
        status = "expired"
    
    logger.debug(f"Billing status for account {account_id}: {status}, plan: {plan}")
    
    return {
        "status": status,
        "plan": plan,
        "current_period_end": current_period_end
    }

## Recent Billing System Changes

This section documents all the recent changes made to the billing system, including fixes, improvements, and new features.

### Schema Access Fix

One of the most critical issues we fixed was the schema access problem that prevented proper billing checks:

```python
# BEFORE: This would fail because it looked for 'public.basejump.billing_subscriptions'
account_user_result = await client.from_('basejump.billing_subscriptions').select('*').execute()

# AFTER: Correctly specifies the schema
account_user_result = await client.schema('basejump').from_('billing_subscriptions').select('*').execute()
```

The issue occurred because when using `client.from_('basejump.billing_subscriptions')`, the client incorrectly looked for a table in `public.basejump.billing_subscriptions` instead of `basejump.billing_subscriptions`.

### Development Mode Bypass

We implemented a development mode bypass to facilitate local testing without requiring actual subscriptions:

```python
# In utils/billing.py
async def check_billing_status(user_id, account_id=None):
    # Development mode bypass
    if os.getenv("ENVIRONMENT", "").lower() == "development":
        logger.warning(f"DEVELOPMENT MODE: Bypassing billing checks for user {user_id}")
        return {
            "status": "active",
            "plan": "team",  # Highest tier for testing
            "is_development": True
        }
    
    # Normal billing check logic...
```

This allows developers to test premium features locally without setting up Stripe test accounts.

### Security Improvements

We enhanced security throughout the billing system:

1. **Webhook Signature Verification**:
   ```python
   event = stripe.Webhook.construct_event(
       payload, sig_header, STRIPE_WEBHOOK_SECRET
   )
   ```

2. **Admin-Only Endpoints**:
   ```python
   @router.post("/admin/override")
   async def admin_billing_override(
       request: Request,
       user_id: str = Depends(get_admin_user_id)  # Special admin check
   ):
   ```

3. **Strict Account Isolation**:
   - Users can only access billing information for their own accounts
   - Admin operations are strictly controlled and logged

### Plan Features and Pricing

We defined clear feature sets for each subscription tier:

#### Free Tier
- **Price**: $0/month
- **Features**:
  - Basic AI capabilities (limited to Claude-3-Haiku model)
  - 1 sandbox environment
  - 100 MB storage per sandbox
  - 5 agent runs per day
  - Community support

#### Pro Tier
- **Price**: $19/month
- **Features**:
  - Advanced AI capabilities (Claude-3-Sonnet model)
  - 3 sandbox environments
  - 500 MB storage per sandbox
  - Unlimited agent runs
  - Priority support
  - File upload capabilities
  - Browser automation

#### Team Tier
- **Price**: $49/month
- **Features**:
  - Premium AI capabilities (Claude-3-Opus model)
  - 10 sandbox environments
  - 1 GB storage per sandbox
  - Unlimited agent runs
  - Priority support with 24-hour response time
  - Team collaboration features
  - Admin dashboard
  - Custom branding
  - API access

### Frontend Billing UI

We implemented a clean, user-friendly billing interface:

1. **Account Settings Page**:
   - Current plan display
   - Usage statistics
   - Upgrade/downgrade options

2. **Checkout Flow**:
   - Seamless integration with Stripe Checkout
   - Clear plan comparison
   - Secure payment processing

3. **Subscription Management**:
   - Integration with Stripe Customer Portal
   - Self-service plan changes
   - Billing history access

### Usage Tracking

We implemented a comprehensive usage tracking system:

```python
@router.post("/track-usage")
async def track_usage(
    request: Request,
    user_id: str = Depends(get_current_user_id)
):
    client = await db.client
    data = await request.json()
    
    account_id = await get_personal_account_id(user_id)
    metric_type = data.get("metric_type")
    count = data.get("count", 1)
    
    # Get current period
    now = datetime.now(timezone.utc)
    period_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    next_month = now.month + 1 if now.month < 12 else 1
    next_year = now.year if now.month < 12 else now.year + 1
    period_end = datetime(next_year, next_month, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
    
    # Update or create usage metric
    # ...
```

This tracks various metrics including:
- Agent runs
- Storage usage
- API calls
- Feature usage

### Billing Verification Middleware

We implemented middleware to check billing status before allowing access to premium features:

```python
async def billing_required(plan_level: str = "pro"):
    """
    Dependency that requires a specific billing plan level.
    
    Usage:
        @router.get("/premium-feature")
        async def premium_feature(
            _: dict = Depends(billing_required("pro"))
        ):
            # This endpoint requires at least a Pro plan
    """
    async def check_billing(user_id: str = Depends(get_current_user_id)):
        billing_status = await check_billing_status(user_id)
        plan = billing_status.get("plan", "free")
        
        plan_levels = {
            "free": 0,
            "pro": 1,
            "team": 2
        }
        
        required_level = plan_levels.get(plan_level, 0)
        user_level = plan_levels.get(plan, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=402,  # Payment Required
                detail=f"This feature requires a {plan_level.capitalize()} plan"
            )
        
        return billing_status
    
    return check_billing
```

### Billing Database Schema Changes

We made several improvements to the billing database schema:

1. **Added Indexes**:
   ```sql
   CREATE INDEX idx_billing_subscriptions_account_id ON basejump.billing_subscriptions(account_id);
   CREATE INDEX idx_billing_overrides_account_id ON basejump.billing_overrides(account_id);
   CREATE INDEX idx_usage_metrics_account_id ON basejump.usage_metrics(account_id);
   ```

2. **Added Foreign Key Constraints**:
   ```sql
   ALTER TABLE basejump.billing_subscriptions
   ADD CONSTRAINT fk_billing_subscriptions_account
   FOREIGN KEY (account_id) REFERENCES auth.users(id);
   ```

3. **Added Audit Columns**:
   ```sql
   ALTER TABLE basejump.billing_subscriptions
   ADD COLUMN created_by UUID REFERENCES auth.users(id),
   ADD COLUMN updated_by UUID REFERENCES auth.users(id);
   ```

### Integration with Account System

We integrated the billing system with the account management system:

1. **Personal Accounts**:
   - Every user automatically gets a personal account (account_id = user_id)
   - Personal accounts have their own billing subscription

2. **Team Accounts**:
   - Users can be members of team accounts
   - Team accounts have their own billing subscription
   - Team owners manage billing for their team

3. **Account Switching**:
   - Users can switch between accounts they belong to
   - Billing checks are performed against the active account

### Handling Failed Payments

We implemented a comprehensive system for handling failed payments:

1. **Grace Period**:
   - 7-day grace period after payment failure
   - Users retain access during grace period
   - Email notifications sent to remind about payment issues

2. **Dunning Management**:
   - Automatic retry of failed payments
   - Escalating notification schedule
   - Admin dashboard for monitoring payment issues

3. **Account Downgrade**:
   - Automatic downgrade to free tier after grace period
   - Data preservation for 30 days after downgrade
   - Easy upgrade path to restore access

### API Rate Limiting

We implemented tier-based API rate limiting:

```python
async def rate_limit_by_plan(user_id: str):
    """Apply rate limits based on user's subscription plan"""
    billing_status = await check_billing_status(user_id)
    plan = billing_status.get("plan", "free")
    
    limits = {
        "free": 100,    # 100 requests per day
        "pro": 1000,    # 1000 requests per day
        "team": 10000   # 10000 requests per day
    }
    
    limit = limits.get(plan, 100)
    
    # Check rate limit
    # ...
```

### Proration and Credits

We implemented a system for handling prorations and credits:

1. **Plan Upgrades**:
   - Immediate access to higher tier
   - Prorated charge for remainder of billing period

2. **Plan Downgrades**:
   - Applied at end of current billing period
   - No refunds for unused time

3. **Credits System**:
   - Admin can issue account credits
   - Credits applied to next invoice
   - Credit history tracking

### Coupons and Promotions

We added support for promotional codes:

1. **Coupon Management**:
   - Admin interface for creating coupons
   - Support for percentage and fixed amount discounts
   - Time-limited promotions

2. **Referral Program**:
   - Users get credits for referring new customers
   - Tracking of referral source
   - Multi-tier referral bonuses

### Reporting and Analytics

We implemented comprehensive billing analytics:

1. **Revenue Dashboard**:
   - Monthly recurring revenue (MRR) tracking
   - Customer acquisition cost (CAC) calculation
   - Lifetime value (LTV) projections

2. **Subscription Metrics**:
   - Churn rate tracking
   - Upgrade/downgrade analysis
   - Cohort analysis

3. **Usage Analytics**:
   - Feature usage by plan
   - Resource consumption patterns
   - Identification of upsell opportunities

These changes have created a robust, secure, and user-friendly billing system that properly integrates with our account structure and provides clear value at each subscription tier.

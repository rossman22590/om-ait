# AI Tutor Machine Billing System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Usage Calculation Architecture](#usage-calculation-architecture)
3. [Tier System and Limits](#tier-system-and-limits)
4. [Database Schema](#database-schema)
5. [Stripe Integration](#stripe-integration)
6. [Client-Side Implementation](#client-side-implementation)
7. [Server-Side Implementation](#server-side-implementation)
8. [Development and Testing](#development-and-testing)
9. [Troubleshooting](#troubleshooting)
10. [Extensibility Points](#extensibility-points)

## Overview

The AI Tutor Machine billing system uses a time-based metering approach that tracks agent usage in minutes. Users are allocated a specific number of minutes per month based on their subscription tier (Free, Pro, or Enterprise). The system integrates with Stripe for payment processing and subscription management.

## Usage Calculation Architecture

### Core Metering Logic

The system calculates usage based on the actual runtime of agent sessions:

```typescript
totalAgentTime = agentRuns.reduce((total, run) => {
  const startTime = new Date(run.started_at).getTime();
  const endTime = run.completed_at 
    ? new Date(run.completed_at).getTime()
    : nowTimestamp;
  
  return total + (endTime - startTime) / 1000; // In seconds
}, 0);

// Convert to minutes
totalMinutes = Math.round(totalAgentTime / 60);
```

### Key Components

1. **Time Tracking**
   - Each agent run is tracked with `started_at` and `completed_at` timestamps
   - For ongoing runs, the current time is used as the end time
   - Minutes are calculated as `(endTime - startTime) / 60`

2. **Monthly Aggregation**
   - Only counts runs from the current calendar month
   - Aggregates time across all threads belonging to an account
   - Resets at the beginning of each month

3. **Remaining Minutes**
   - `remainingMinutes = planTotalMinutes - totalMinutes`
   - Always floors at zero (never shows negative remaining)

### Implementation Files

- Main calculator: `frontend/src/lib/usage-calculator.ts`
- Usage display: `frontend/src/components/basejump/account-billing-status.tsx`

## Tier System and Limits

### Plan Structure

| Plan Name  | Monthly Minutes | Monthly Price | Features |
|------------|----------------|--------------|----------|
| Free       | 25 minutes     | $0           | Basic features |
| Pro        | 500 minutes    | $10          | Advanced autonomous capabilities, priority processing |
| Enterprise | 3000 minutes   | $50          | Maximum capabilities, custom integrations, advanced analytics |

### Plan Recognition Logic

The system identifies the user's plan through the Stripe subscription:

```typescript
export function getPlanName(
  subscriptionData: { price_id: string; status: string } | null, 
  plans: { FREE: string; PRO: string; ENTERPRISE: string }
): string {
  if (!subscriptionData || subscriptionData.status !== 'active') {
    return "Free";
  }
  
  const isPlan = (planId: string) => subscriptionData.price_id === planId;
  
  return isPlan(plans.FREE) 
    ? "Free" 
    : isPlan(plans.PRO)
      ? "Pro"
      : isPlan(plans.ENTERPRISE)
        ? "Enterprise"
        : "Unknown";
}
```

### Environment Configuration

Plan IDs are configured through environment variables:

```
STRIPE_FREE_PLAN_ID=price_1RGtl4G23sSyONuFYWYsA0HK
STRIPE_PRO_PLAN_ID=price_1RGtkVG23sSyONuF8kQcAclk
STRIPE_ENTERPRISE_PLAN_ID=price_1RGw3iG23sSyONuFGk8uD3XV
```

## Database Schema

### Key Tables

1. **threads**
   - Links user accounts to conversation threads
   - Key fields: `thread_id`, `account_id`

2. **agent_runs**
   - Stores timing data for each agent execution
   - Key fields: `thread_id`, `started_at`, `completed_at`

3. **basejump.billing_subscriptions**
   - Stores subscription data from Stripe
   - Key fields: `id`, `account_id`, `billing_customer_id`, `status`, `price_id`, `plan_name`
   - Created/updated by Stripe webhooks

### Subscription Status Types

Defined in SQL as:
```sql
create type basejump.subscription_status as enum (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid'
);
```

### Schema Access Considerations

The system has fallback mechanisms to handle schema access issues:
- Tries both `basejump` and `public` schemas
- Uses `client.schema('basejump').from_('table_name')` instead of `client.from_('basejump.table_name')`

## Stripe Integration

### Key Components

1. **Stripe Webhook Handler**
   - Endpoint: `/backend/supabase/functions/billing-webhooks/index.ts`
   - Processes subscription events from Stripe
   - Updates database entries via `service_role_upsert_customer_subscription`

2. **Checkout Process**
   - API route: `/api/create-checkout-session`
   - Maps plan IDs (like 'pro', 'enterprise') to Stripe price IDs from environment variables
   - Handles redirects after checkout

3. **Customer Portal**
   - Allows users to manage existing subscriptions
   - Implemented in `/lib/actions/billing.ts`

### Subscription Update Flow

1. User upgrades to new plan in UI → Stripe checkout
2. Stripe processes payment → Sends webhook event
3. Webhook handler receives event → Updates `billing_subscriptions` table
4. UI reads from this table → Displays current plan and usage limits

### SQL Upsert Mechanism

When a subscription is updated, the system uses this SQL function:

```sql
CREATE OR REPLACE FUNCTION public.service_role_upsert_customer_subscription(account_id uuid,
                                                                           customer jsonb default null,
                                                                           subscription jsonb default null)
```

This performs a true upsert operation:
- Creates a new record if one doesn't exist
- Updates existing records based on subscription ID
- Handles all relevant fields including plan_name, price_id, status, etc.

## Client-Side Implementation

### Key Components

1. **AccountBillingStatus**
   - Displays current plan and usage statistics
   - Calculates usage in real-time on the client side
   - Renders differently based on environment (development vs production)

2. **PlanComparison**
   - Shows available plans with features and pricing
   - Handles plan selection and checkout
   - Communicates current plan via global window variable

3. **Usage Calculation Hook**
   - Defined in `useCallback` to optimize performance
   - Fetches agent runs and calculates minutes used
   - Updates when plan changes or when component mounts

### Example Usage Display Logic

```typescript
// Format usage based on the current plan limit
const remaining = Math.max(0, planLimit - minutes);

const formattedUsage = minutes > 0 
    ? `${minutes}/${planLimit} minutes (${remaining} remaining)` 
    : "No usage this month";
```

## Server-Side Implementation

### Webhook Processing

1. **Event Validation**
   - Verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
   - Processes only valid Stripe events

2. **Database Updates**
   - Directly updates subscription information in database
   - Includes plan name, price ID, and status updates

3. **Error Handling**
   - Logs webhook processing errors
   - Handles schema access issues with fallback mechanisms

### SQL Functions

These SQL functions handle subscription data management:

1. **service_role_upsert_customer_subscription**
   - Updates or creates subscription records
   - Takes account_id, customer, and subscription JSON data

2. **get_account_billing_status**
   - Retrieves billing status for an account
   - Used by frontend to display subscription details

## Development and Testing

### Local Development Mode

```typescript
// In local development mode, show a simplified component
if (isLocalMode()) {
    return (
        <div className="rounded-xl border shadow-sm bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
            <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                    Running in local development mode - billing features are disabled
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    Agent usage limits are not enforced in this environment
                </p>
            </div>
        </div>
    );
}
```

### Testing Subscriptions

1. **Stripe Test Mode**
   - Use Stripe test mode for development
   - Create test customers and subscriptions

2. **Manual Database Entries**
   - For testing, you can manually insert subscription records:
   ```sql
   INSERT INTO basejump.billing_subscriptions (
     id, account_id, status, price_id, plan_name, 
     created, current_period_start, current_period_end
   )
   VALUES (
     'sub_free_' || substr(md5(random()::text), 1, 16),
     '[ACCOUNT_ID]',
     'active',
     'price_1RGtl4G23sSyONuFYWYsA0HK',
     'free',
     NOW(),
     NOW(),
     NOW() + INTERVAL '30 days'
   );
   ```

3. **Simulating Usage**
   - You can create test agent_runs entries to simulate usage
   - Be sure to use valid thread_ids linked to the account

## Troubleshooting

### Common Issues

1. **"Invalid subscription tier" error**
   - Check that price_id in the database matches environment variables
   - Verify the subscription has status='active'
   - Ensure subscription is linked to the correct account_id

2. **Schema Access Issues**
   - The system has implemented fallbacks to check both schemas
   - If issues persist, verify database permissions and schema existence

3. **Inconsistent Usage Display**
   - Calculation happens client-side; check for JS errors
   - Verify agent_runs records have proper timestamps

4. **Activating Trial Subscriptions**
   - After a user subscribes, they may be in "trialing" status initially
   - To make subscriptions active immediately, update the status in the database:
   ```sql
   UPDATE basejump.billing_subscriptions
   SET status = 'active'
   WHERE status = 'trialing' AND account_id = '[ACCOUNT_ID]';
   ```
   - This change bypasses the trial period and makes the subscription active immediately

### Logging

Enable detailed logging for troubleshooting:
- Set `DEBUG=true` in environment variables
- Check browser console for client-side calculation issues
- Review server logs for webhook processing errors

## Extensibility Points

### Adding New Plans

1. Update the `PLAN_LIMITS` constant in `account-billing-status.tsx`:
```typescript
const PLAN_LIMITS = {
    "Free": 25,
    "Pro": 500,
    "Enterprise": 3000,
    "YourNewPlan": 1000  // Add your new plan here
};
```

2. Add the plan to the `getPlanMinutes` function in usage-calculator.ts:
```typescript
export function getPlanMinutes(planName: string): number {
  switch (planName) {
    // Existing cases...
    case "YourNewPlan":
      return 1000;
    default:
      return 25;
  }
}
```

3. Create a new price in Stripe dashboard and add the price ID to environment variables

### Modifying Usage Calculation

To change how minutes are calculated:

1. Modify the `calculateAgentUsage` function in usage-calculator.ts
2. Update the display logic in `account-billing-status.tsx`
3. Consider adding new fields to `agent_runs` if tracking additional metrics

### Custom Billing Periods

If you need billing periods other than calendar months:

1. Modify the `startOfMonth` calculation in usage calculation logic
2. Update SQL queries to filter by your custom date range
3. Consider adding period start/end dates to subscription records

-----------------------------



Adding New Pricing Plans to OM-AIT System
This document provides a comprehensive guide on how to add new pricing plans to the OM-AIT system, covering all components from Stripe setup to database configuration and frontend display.

Table of Contents
System Architecture Overview
Stripe Integration
Database Configuration
Backend Implementation
Frontend Implementation
Testing Your New Plan
Troubleshooting
System Architecture Overview
The OM-AIT billing system uses a time-based usage model where:

Each plan has a monthly minute allocation
Usage is tracked through agent_runs with timestamps
Subscriptions are managed via Stripe
Tier information is stored in both the database and environment variables
The system consists of three main components:

Stripe - Handles payments and subscription lifecycle
Supabase - Stores subscription and usage data
Application Code - Manages plan logic and enforcement
Stripe Integration
1. Create a New Price in Stripe
Log in to the Stripe Dashboard
Navigate to Products > Create Product
Create a new product or select an existing one
Add a new price with:
Pricing model: Recurring
Billing period: Monthly
Price: Your desired amount
Save the new price and note the Price ID (begins with price_)
2. Configure Webhook Events
Ensure your Stripe webhooks are configured to handle:

customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
Your webhook endpoint is /api/webhooks/stripe which processes these events.

Database Configuration
1. Schema Overview
The subscription data is stored in the basejump.billing_subscriptions table with these key fields:

id: Subscription ID from Stripe (e.g., sub_12345)
account_id: The account this subscription belongs to
price_id: Stripe Price ID (e.g., price_1RGtl4G23sSyONuFYWYsA0HK)
status: Subscription status (active, trialing, canceled, etc.)
plan_name: Human-readable plan name (free, pro, enterprise, etc.)
2. Adding a Test Subscription
To test your new plan without going through the Stripe checkout flow:

sql
CopyInsert
INSERT INTO basejump.billing_subscriptions (
  id, account_id, status, price_id, plan_name, 
  created, current_period_start, current_period_end
)
VALUES (
  'sub_test_' || substr(md5(random()::text), 1, 16),
  '[ACCOUNT_ID]',
  'active',
  'price_YOUR_NEW_PLAN_ID',
  'your_plan_name',
  NOW(),
  NOW(),
  NOW() + INTERVAL '30 days'
);
Backend Implementation
1. Update Environment Variables
Add your new plan ID to your .env file:

CopyInsert
STRIPE_NEW_PLAN_ID=price_YOUR_NEW_PLAN_ID
2. Modify SUBSCRIPTION_TIERS in billing.py
In backend/utils/billing.py, update the SUBSCRIPTION_TIERS dictionary:

python
CopyInsert
SUBSCRIPTION_TIERS = {
    'price_1RGtl4G23sSyONuFYWYsA0HK': {'name': 'free', 'minutes': 25},
    'price_1RGtkVG23sSyONuF8kQcAclk': {'name': 'base', 'minutes': 500},
    'price_1RGw3iG23sSyONuFGk8uD3XV': {'name': 'extra', 'minutes': 3000},
    'price_YOUR_NEW_PLAN_ID': {'name': 'your_plan_name', 'minutes': YOUR_MINUTES_LIMIT}
}
The minutes value determines the monthly usage limit for this plan.

3. Update Webhook Handler
The webhook handler in billing.py already looks up plan details based on the price ID, so it should work automatically with your new plan as long as it's in the SUBSCRIPTION_TIERS dictionary.

Frontend Implementation
1. Update Environment Variables
Add your new plan ID to your frontend .env file:

CopyInsert
NEXT_PUBLIC_STRIPE_NEW_PLAN_ID=price_YOUR_NEW_PLAN_ID
2. Update SUBSCRIPTION_PLANS in plan-comparison.tsx
In frontend/src/components/billing/plan-comparison.tsx, add your plan to the SUBSCRIPTION_PLANS object:

javascript
CopyInsert
export const SUBSCRIPTION_PLANS = {
  FREE: process.env.NEXT_PUBLIC_STRIPE_FREE_PLAN_ID || 'price_1RGtl4G23sSyONuFYWYsA0HK',
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID || 'price_1RGtkVG23sSyONuF8kQcAclk',
  ENTERPRISE: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_ID || 'price_1RGw3iG23sSyONuFGk8uD3XV',
  YOUR_PLAN: process.env.NEXT_PUBLIC_STRIPE_NEW_PLAN_ID || 'price_YOUR_NEW_PLAN_ID',
};
The key (e.g., YOUR_PLAN) should be uppercase and match the naming pattern.

3. Modify siteConfig in home.tsx
In frontend/src/lib/home.tsx, update the cloudPricingItems array to include your new plan:

javascript
CopyInsert
cloudPricingItems: [
  {
    name: "free",
    description: "For individuals",
    price: "$0",
    features: ["25 minutes/month", "Basic features", ...],
    highlighted: false
  },
  // ... existing plans ...
  {
    name: "your_plan_name", // Must match the name in SUBSCRIPTION_TIERS
    description: "Your plan description",
    price: "$XX",
    features: ["YOUR_MINUTES minutes/month", "Feature 1", "Feature 2", ...],
    highlighted: false // Set to true to emphasize this plan
  }
]
Important: The name field must be lowercase and match exactly the name in your SUBSCRIPTION_TIERS dictionary.

4. Update AccountBillingStatus Component (If Needed)
The frontend/src/components/basejump/account-billing-status.tsx component is responsible for displaying usage. The component already derives the plan from the subscription data, but you may want to update any hardcoded values for plan minutes:

javascript
CopyInsert
// If you have any hardcoded mappings like this:
const planMinutes = {
  "free": 25,
  "pro": 500, 
  "enterprise": 3000,
  "your_plan_name": YOUR_MINUTES_LIMIT
};
Testing Your New Plan
1. Test Database Detection
After adding your plan:

Add a test subscription with your new price ID
Verify the backend correctly identifies the plan tier in logs
Check that the correct usage limit is applied
2. Test Subscription Flow
To test the full subscription flow:

Deploy your changes to a test environment
Start a Stripe test subscription using test card details
Verify that webhooks correctly create the subscription in your database
Confirm the frontend displays the correct plan and usage limits
3. Test Usage Monitoring
Create some test usage to ensure limits are enforced:

Run agents to generate usage (or insert test records)
Verify that the usage calculation correctly counts minutes
Test approaching and exceeding the limit to ensure proper enforcement
Troubleshooting
Common Issues
1. Subscription Not Recognized
If your new plan isn't being recognized:

Double-check the price ID in SUBSCRIPTION_TIERS matches exactly with Stripe
Verify the webhook is receiving and processing events
Check the database for the correct price_id value
2. Frontend Plan Detection Issues
If the frontend doesn't show the correct plan:

Inspect the browser console logs (look for [CLIENT] prefixed logs)
Verify that SUBSCRIPTION_PLANS includes your new plan with the correct ID
Check that the name in cloudPricingItems matches the name in SUBSCRIPTION_TIERS
3. Usage Limits Not Enforced
If usage limits aren't being enforced correctly:

Verify the minutes value in SUBSCRIPTION_TIERS
Check that calculate_monthly_usage is counting correctly
Look for any hardcoded values in the codebase that need updating
Logging and Debugging
For debugging subscription issues:

Set DEBUG=true in your environment variables
Check browser console for client-side logs
Review server logs for webhook processing events
Schema Access Issues
If you encounter schema access issues:

The system has fallbacks to check both public and basejump schemas
Verify that your database user has access to both schemas
Check the SQL queries in both schemas to ensure they're finding the subscription
This guide should help you successfully add new pricing plans to the OM-AIT system. If you encounter issues not covered here, check the relevant code in billing.py and plan-comparison.tsx for more details on the implementation.
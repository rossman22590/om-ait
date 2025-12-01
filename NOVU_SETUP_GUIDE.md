# Novu In-App Notifications Setup Guide

## Problem
You're receiving email notifications but they're not appearing in the in-app inbox dropdown.

## Root Cause
Your Novu workflows (like `task-completed`) only have **Email** channel steps configured, but NOT **In-App** channel steps.

## Solution

### Step 1: Login to Novu Dashboard
1. Go to https://web.novu.co or https://dashboard.novu.co
2. Login with your account
3. Select your application: **L4o2goWLBEkS** (NEXT_PUBLIC_NOVU_APP_IDENTIFIER)

### Step 2: Add In-App Channel to task-completed Workflow

1. In the Novu dashboard, go to **Workflows**
2. Find and click on **task-completed** workflow
3. Click **"Add Step"** or **"Edit Workflow"**
4. Add an **In-App** channel step with the following configuration:

#### In-App Step Configuration:

**Subject (Title):**
```
Task Completed
```

**Body (Message):**
```
Your task "{{payload.task_name}}" has been completed successfully!
```

**Avatar (Optional):**
```
https://your-cdn.com/task-success-icon.png
```

**Action Configuration:**

**Primary Action:**
- Label: `View Task`
- URL: `{{payload.task_url}}`

**Redirect:**
- URL: `{{payload.task_url}}`
- Target: `_self`

**Tags (Optional):**
```json
["task", "completed"]
```

> **Note:** Variables must use `{{payload.variable_name}}` syntax in Novu workflows.

### Step 3: Repeat for Other Workflows

Apply the same In-App channel configuration to these workflows:

#### task-failed
- Subject: `Task Failed`
- Body: `Your task "{{payload.task_name}}" failed. Reason: {{payload.failure_reason}}`
- Primary Action: View Task → `{{payload.task_url}}`

#### payment-succeeded
- Subject: `Payment Successful`
- Body: `Your payment of {{payload.formatted_amount}} for {{payload.plan_name}} was successful!`
- Tags: `["payment", "success"]`

#### payment-failed
- Subject: `Payment Failed`
- Body: `Your payment of {{payload.formatted_amount}} failed. Reason: {{payload.reason}}`
- Primary Action: Update Payment → `{{payload.action_url}}`
- Tags: `["payment", "failed"]`

#### credits-low
- Subject: `Credits Running Low`
- Body: `You have {{payload.remaining_credits}} credits remaining ({{payload.threshold_percentage}}% threshold)`
- Primary Action: Buy Credits → `{{payload.action_url}}`
- Tags: `["credits", "warning"]`

#### welcome-email
- Subject: `Welcome to Machine!`
- Body: `Welcome aboard! We're excited to have you.`
- Tags: `["onboarding"]`

### Step 4: Test the Configuration

1. Trigger a test notification from Novu dashboard
2. Or trigger it from your app (e.g., complete a task)
3. Check the inbox dropdown in your frontend
4. Open browser console and check for any Novu errors

### Step 5: Verify Subscriber ID Match

Make sure the `subscriberId` in your frontend matches the `subscriber_id` used in backend:

**Frontend (notification-dropdown.tsx):**
```typescript
subscriberId={user.id}  // This is the Supabase auth user ID
```

**Backend (notification_service.py):**
```python
subscriber_id=account_id  # This should be the same Supabase auth user ID
```

### Debugging Tips

1. **Check Browser Console:**
   - Open DevTools → Console
   - Look for Novu SDK errors or warnings
   - Check Network tab for failed API calls to Novu

2. **Check Novu Activity Feed:**
   - In Novu dashboard, go to **Activity Feed**
   - Look for recent notifications
   - Check if they have `in_app` channel status
   - Verify the `subscriberId` matches your user ID

3. **Verify Environment Variables:**
   ```bash
   # Frontend .env
   NEXT_PUBLIC_NOVU_APP_IDENTIFIER=L4o2goWLBEkS
   
   # Backend .env
   NOVU_SECRET_KEY=65243c4d6ff25e8ec4f1de9d5e9867cc
   ENV_MODE=production
   ```

4. **Check Subscriber in Novu:**
   - Go to Novu dashboard → Subscribers
   - Search for your user ID
   - Verify the subscriber exists and has correct email

### Common Issues

**Issue 1: Inbox is empty**
- ✅ Solution: Add In-App channel step to workflow

**Issue 2: Notifications appear but are not styled**
- ✅ Solution: Check `appearance` prop in Inbox component

**Issue 3: Wrong subscriber ID**
- ✅ Solution: Ensure backend uses same user ID as frontend

**Issue 4: Workflow not triggering**
- ✅ Solution: Check Activity Feed in Novu dashboard
- ✅ Check backend logs for Novu trigger errors
- ✅ Verify workflow identifier matches exactly (case-sensitive)

### Next Steps

After configuring the In-App channel:

1. Restart your Next.js development server
2. Clear browser cache and localStorage
3. Trigger a test notification
4. Check the inbox dropdown - it should now show notifications!

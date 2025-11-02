# BYPASS_TRIAL Agent Access Fix

## Issue

BYPASS_TRIAL users were unable to chat with agents due to "Access denied" errors:

```
ValueError: Access denied to agent d690e690-530e-42d4-b8b2-d3ede8823ba0
File "/app/core/agent_loader.py", line 205, in load_agent
  raise ValueError(f"Access denied to agent {agent_id}")
```

### Root Cause

When a new user with `BYPASS_TRIAL=true` was created:

1. ✅ Credit account was created successfully with $10 credits
2. ✅ Credit ledger entry was created
3. ❌ **Default Suna agent was NOT created immediately**
4. ❌ User tried to chat, but had no agents
5. ❌ Frontend tried to use an agent_id that didn't belong to them
6. ❌ Backend rejected access with "Access denied to agent"

The `ensure_suna_installed()` function was only called:
- When checking billing status (`/check-status` endpoint)
- When starting an agent run (too late if agent_id already specified)

## Solution

### Modified: `backend/core/credits.py`

Added immediate Suna agent creation during account creation for both BYPASS_TRIAL and FREE_TIER users:

#### BYPASS_TRIAL Path

```python
# After creating credit account
try:
    from core.utils.ensure_suna import ensure_suna_installed
    await ensure_suna_installed(user_id)
    logger.info(f"Ensured Suna agent for BYPASS_TRIAL user {user_id}")
except Exception as suna_error:
    logger.warning(f"Failed to create Suna agent for BYPASS_TRIAL user {user_id}: {suna_error}")
    # Don't fail account creation if Suna creation fails
```

#### FREE_TIER Path (TRIAL_ENABLED)

```python
# After creating credit account  
try:
    from core.utils.ensure_suna import ensure_suna_installed
    await ensure_suna_installed(user_id)
    logger.info(f"Ensured Suna agent for FREE_TIER user {user_id}")
except Exception as suna_error:
    logger.warning(f"Failed to create Suna agent for FREE_TIER user {user_id}: {suna_error}")
    # Don't fail account creation if Suna creation fails
```

## Changes

### File: `backend/core/credits.py`

**Location**: In `get_balance()` method after credit account creation

**Added**:
1. Import `ensure_suna_installed` from `core.utils.ensure_suna`
2. Call `await ensure_suna_installed(user_id)` immediately after account creation
3. Log success or failure
4. Catch exceptions to prevent account creation failure if Suna creation fails

## Behavior

### Before Fix

**New BYPASS_TRIAL User Flow**:
1. User signs up → Credit account created with $10
2. User lands on dashboard → No agents available
3. User tries to chat → Frontend selects agent (possibly wrong one)
4. Backend: "Access denied to agent" error ❌
5. User cannot chat ❌

### After Fix

**New BYPASS_TRIAL User Flow**:
1. User signs up → Credit account created with $10
2. **→ Suna default agent automatically created** ✅
3. User lands on dashboard → Suna agent available ✅
4. User tries to chat → Uses their own Suna agent ✅
5. Backend: Chat works successfully ✅
6. User can chat immediately ✅

### Same fix applies to FREE_TIER users (TRIAL_ENABLED)

## Benefits

1. **Immediate Chat Access**: New users can start chatting right away
2. **No Access Errors**: Users always have at least one agent (Suna)
3. **Better UX**: Seamless onboarding experience
4. **Consistent Behavior**: Same flow for BYPASS_TRIAL and FREE_TIER users
5. **Fail-Safe**: Account creation succeeds even if Suna creation fails
6. **Proper Logging**: Clear logs for debugging Suna installation

## Testing

### Test BYPASS_TRIAL User Signup

1. Set `BYPASS_TRIAL=true` in `.env`
2. Create new user account via signup
3. Verify logs show:
   ```
   Creating BYPASS_TRIAL account for new user <user_id> with $10.00
   Successfully created BYPASS_TRIAL account for user <user_id>
   Ensured Suna agent for BYPASS_TRIAL user <user_id>
   ```
4. Verify database:
   - `credit_accounts` table has user with balance=10.00, trial_status='none'
   - `agents` table has Suna agent with account_id=<user_id>
   - `metadata->>is_suna_default` = 'true'
5. Login as new user
6. Verify dashboard shows Suna agent
7. Start a new chat
8. Verify chat works without "Access denied" errors

### Test FREE_TIER User Signup (TRIAL_ENABLED)

1. Set `BYPASS_TRIAL=false` in `.env` (or remove it)
2. Ensure `TRIAL_ENABLED=true`
3. Create new user account via signup
4. Verify logs show:
   ```
   Creating FREE TIER account for new user <user_id>
   Successfully created FREE TIER account for user <user_id>
   Ensured Suna agent for FREE_TIER user <user_id>
   ```
5. Verify database has user with Suna agent
6. Login and test chat

## Error Handling

### If Suna Creation Fails

```python
except Exception as suna_error:
    logger.warning(f"Failed to create Suna agent for BYPASS_TRIAL user {user_id}: {suna_error}")
    # Don't fail account creation if Suna creation fails
```

- **Account creation still succeeds** ✅
- **Warning logged** for debugging
- **User can still login** (Suna will be created on first chat attempt)
- **No breaking errors** for account setup

## Related Files

- `backend/core/credits.py` - Credit account creation and Suna installation
- `backend/core/utils/ensure_suna.py` - Suna agent installation service
- `backend/core/utils/suna_default_agent_service.py` - Suna agent creation logic
- `backend/core/agent_loader.py` - Agent access control (line 205 check)
- `backend/core/agent_runs.py` - Agent run initialization

## Logs to Watch For

### Success Logs

```
Creating BYPASS_TRIAL account for new user 2fac6dbc-359c-495f-869c-1404b393d4f4 with $10.00
Successfully created BYPASS_TRIAL account for user 2fac6dbc-359c-495f-869c-1404b393d4f4
Installing Suna agent for account 2fac6dbc-359c-495f-869c-1404b393d4f4
Successfully installed Suna agent d690e690-530e-42d4-b8b2-d3ede8823ba0 for account 2fac6dbc-359c-495f-869c-1404b393d4f4
Ensured Suna agent for BYPASS_TRIAL user 2fac6dbc-359c-495f-869c-1404b393d4f4
```

### Warning Logs (Non-Fatal)

```
Failed to create Suna agent for BYPASS_TRIAL user <user_id>: <error_message>
```

## Status

✅ **FIXED** - BYPASS_TRIAL and FREE_TIER users now get Suna agent immediately upon account creation

# Free Tier Model Access Fix

## Issue

Free tier and BYPASS_TRIAL users were unable to use any AI models due to model access restrictions:

```json
{
    "detail": {
        "message": "Your current subscription plan does not include access to openai/gpt-5-nano-2025-08-07. Please upgrade your subscription.",
        "allowed_models": []
    }
}
```

**User Impact**:
- ❌ Free tier users cannot chat with agents
- ❌ BYPASS_TRIAL users cannot chat with agents
- ❌ "No models allowed" error
- ❌ Users forced to upgrade even though they have credits

### Root Cause

In `backend/core/billing/config.py`, the tier definitions had:

```python
'none': Tier(
    name='none',
    models=[],  # ← No models allowed!
    ...
),
'free': Tier(
    name='free',
    models=[],  # ← No models allowed!
    ...
),
```

When `is_model_allowed(tier_name, model_name)` was called:
- Free tier had `models=[]` (empty list)
- Check failed: model NOT in empty list
- Error: "Your current subscription plan does not include access..."
- `allowed_models=[]` returned

## Solution

### Modified: `backend/core/billing/config.py`

**Added FREE_MODEL_ID import** and **updated tier configurations** to allow free model access:

```python
# Import FREE_MODEL_ID to make it available for free tier users
from core.ai_models.registry import FREE_MODEL_ID

TIERS: Dict[str, Tier] = {
    'none': Tier(
        name='none',
        models=[FREE_MODEL_ID],  # ← Allow free model
        ...
    ),
    'free': Tier(
        name='free',
        models=[FREE_MODEL_ID],  # ← Allow free model
        ...
    ),
    ...
}
```

## Changes

### File: `backend/core/billing/config.py`

**Line 18** - Added import:
```python
from core.ai_models.registry import FREE_MODEL_ID
```

**Lines 32-36** - Updated 'none' tier:
```python
'none': Tier(
    name='none',
    price_ids=[],
    monthly_credits=Decimal('0.00'),
    display_name='No Plan',
    can_purchase_credits=True,
    models=[FREE_MODEL_ID],  # ← Changed from [] to [FREE_MODEL_ID]
    project_limit=3
),
```

**Lines 37-42** - Updated 'free' tier:
```python
'free': Tier(
    name='free',
    price_ids=[],
    monthly_credits=Decimal('0.00'),
    display_name='Free Tier (Discontinued)',
    can_purchase_credits=True,
    models=[FREE_MODEL_ID],  # ← Changed from [] to [FREE_MODEL_ID]
    project_limit=3
),
```

## Behavior

### Before Fix

**Free Tier User Flow**:
1. User tries to chat with agent
2. Backend checks `is_model_allowed('free', model_name)`
3. Free tier has `models=[]`
4. Check fails: model not in empty list ❌
5. Error: "Your current subscription plan does not include access..." ❌
6. `allowed_models=[]` returned ❌
7. User cannot chat ❌

**BYPASS_TRIAL User Flow**:
1. User signs up with `BYPASS_TRIAL=true`
2. Gets $10 credits + free tier
3. Tries to chat
4. Same error as above ❌
5. Cannot use credits even though they have $10 ❌

### After Fix

**Free Tier User Flow**:
1. User tries to chat with agent
2. Backend checks `is_model_allowed('free', model_name)`
3. Free tier has `models=[FREE_MODEL_ID]`
4. If using free model: Check passes ✅
5. Credits checked (user has credits)
6. Chat works successfully ✅

**BYPASS_TRIAL User Flow**:
1. User signs up with `BYPASS_TRIAL=true`
2. Gets $10 credits + free tier ✅
3. Gets Suna agent with FREE_MODEL_ID ✅
4. Tries to chat
5. Model access check passes ✅
6. Credits check passes ($10 available) ✅
7. User can chat immediately ✅

## Free Model

From `backend/core/ai_models/registry.py`:

```python
FREE_MODEL_ID = "openrouter/moonshotai/kimi-k2"
```

**Free Tier & 'None' Tier Users**:
- ✅ Can use: `openrouter/moonshotai/kimi-k2` (Kimi K2)
- ❌ Cannot use: Premium models (GPT-4, Claude, etc.)

**Paid Tier Users** (tier_2_20 and above):
- ✅ Can use: `'all'` - All models including premium

## Model Access Logic

```python
def is_model_allowed(tier_name: str, model: str) -> bool:
    tier = TIERS.get(tier_name, TIERS['none'])
    if 'all' in tier.models:  # Paid tiers
        return True
    return model in tier.models  # Free tiers - check specific model
```

**For free tier users**:
- `tier.models = [FREE_MODEL_ID]`
- Check: Is requested model in `[FREE_MODEL_ID]`?
- If yes → Access granted ✅
- If no → Access denied ❌

## Impact

### Who This Affects

- ✅ **BYPASS_TRIAL users** - Can now use free model
- ✅ **Free tier users** - Can now use free model
- ✅ **Trial users** - Can use free model during trial
- ✅ **Users with 'none' tier** - Can use free model

### What This Fixes

1. **Model Access** - Free tier users can use FREE_MODEL_ID ✅
2. **BYPASS_TRIAL** - Users can use their $10 credits ✅
3. **Agent Chat** - Users can chat with agents ✅
4. **Error Messages** - Proper `allowed_models` list returned ✅
5. **User Onboarding** - New users can start using immediately ✅

## Testing

### Test Free Tier Model Access

1. Login as free tier user (or BYPASS_TRIAL user)
2. Create agent (should use FREE_MODEL_ID by default)
3. Start a chat
4. Verify:
   - ✅ Chat works without model access error
   - ✅ No "subscription plan does not include access" error
   - ✅ Credits are deducted properly
   - ✅ Agent responds successfully

### Test Premium Model Restriction

1. Login as free tier user
2. Try to manually select a premium model (e.g., GPT-4)
3. Verify:
   - ❌ Access denied (as expected)
   - ℹ️ Error message lists allowed models: `[FREE_MODEL_ID]`
   - ℹ️ Suggests upgrading subscription

### Verify Tier Configuration

Check database:
```sql
SELECT account_id, tier, balance 
FROM credit_accounts 
WHERE tier IN ('free', 'none');
```

Expected:
- `tier='free'` → Can use `FREE_MODEL_ID`
- `balance > 0` → Has credits to spend
- Model access check passes ✅

## Environment Variables

### BYPASS_TRIAL

When `BYPASS_TRIAL=true`:
1. New users get `tier='free'` ✅
2. New users get `balance='10.00'` ✅
3. New users get `trial_status='none'` ✅
4. **New users can use `FREE_MODEL_ID`** ✅ (this fix)

All together = Complete working onboarding! 🚀

## Related Files

- `backend/core/billing/config.py` - Tier definitions (fixed)
- `backend/core/ai_models/registry.py` - FREE_MODEL_ID constant
- `backend/core/billing/billing_integration.py` - Model access checks
- `backend/core/ai_models/manager.py` - get_default_model_for_user()

## Related Fixes

This completes the trilogy of BYPASS_TRIAL fixes:

1. **BYPASS_TRIAL_AGENT_ACCESS_FIX.md** - Suna agent creation ✅
2. **FREE_MODEL_ID_IMPORT_FIX.md** - Model manager import ✅
3. **FREE_TIER_MODEL_ACCESS_FIX.md** - Tier model permissions ✅ (this fix)

Together they ensure:
1. BYPASS_TRIAL users get credit account with $10 ✅
2. Users get default Suna agent immediately ✅
3. Agent creation works with proper model assignment ✅
4. **Users can actually USE the free model** ✅ (this fix)
5. Users can chat immediately without errors ✅

## Status

✅ **FIXED** - Free tier and BYPASS_TRIAL users can now use the free model (`openrouter/moonshotai/kimi-k2`) to chat with agents.

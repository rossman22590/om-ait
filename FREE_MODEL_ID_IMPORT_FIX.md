# FREE_MODEL_ID Import Fix

## Issue

Users could not create agents due to a missing import error:

```
NameError: name 'FREE_MODEL_ID' is not defined
```

**Error Logs**:
```
{"event": "Failed to determine user tier for 7a0dcef1-a75f-44c2-87f8-79def3c6954a: name 'FREE_MODEL_ID' is not defined", "level": "warning", "filename": "manager.py", "lineno": 236}
{"event": "Error creating initial version: name 'FREE_MODEL_ID' is not defined", "level": "error", "filename": "agent_crud.py", "lineno": 650}
```

**User Impact**:
- ❌ Cannot create new agents
- ❌ Agent creation returns HTTP 500 error
- ❌ Error message: `{"detail":"Failed to create initial version"}`

### Root Cause

In `backend/core/ai_models/manager.py`:
- `PREMIUM_MODEL_ID` was imported from registry ✅
- `FREE_MODEL_ID` was NOT imported ❌
- Code used `FREE_MODEL_ID` at line 234 causing `NameError`

**Code Location**: `get_default_model_for_user()` method

```python
# Line 234-235 in manager.py
return FREE_MODEL_ID  # ← NameError: 'FREE_MODEL_ID' is not defined
```

## Solution

### Modified: `backend/core/ai_models/manager.py`

**Changed import statement** from:
```python
from .registry import PREMIUM_MODEL_ID
```

**To**:
```python
from .registry import PREMIUM_MODEL_ID, FREE_MODEL_ID
```

## Changes

### File: `backend/core/ai_models/manager.py`

**Location**: Line 5 (imports section)

**Before**:
```python
from typing import Optional, List, Dict, Any, Tuple
from .registry import registry
from .ai_models import Model, ModelCapability
from core.utils.logger import logger
from .registry import PREMIUM_MODEL_ID  # ← Missing FREE_MODEL_ID
```

**After**:
```python
from typing import Optional, List, Dict, Any, Tuple
from .registry import registry
from .ai_models import Model, ModelCapability
from core.utils.logger import logger
from .registry import PREMIUM_MODEL_ID, FREE_MODEL_ID  # ← Added FREE_MODEL_ID
```

## Behavior

### Before Fix

**Agent Creation Flow**:
1. User clicks "Create Agent"
2. Backend tries to create agent with initial version
3. Calls `get_default_model_for_user()` to determine model
4. For free tier users, tries to return `FREE_MODEL_ID`
5. **NameError: name 'FREE_MODEL_ID' is not defined** ❌
6. Agent creation fails with HTTP 500 ❌
7. Frontend shows: `{"detail":"Failed to create initial version"}` ❌

### After Fix

**Agent Creation Flow**:
1. User clicks "Create Agent"
2. Backend tries to create agent with initial version
3. Calls `get_default_model_for_user()` to determine model
4. For free tier users, returns `FREE_MODEL_ID` = `"openrouter/moonshotai/kimi-k2"` ✅
5. Agent created successfully with default model ✅
6. HTTP 200 response ✅
7. User can create and use agents ✅

## Model Defaults

From `backend/core/ai_models/registry.py`:

```python
FREE_MODEL_ID = "openrouter/moonshotai/kimi-k2"
PREMIUM_MODEL_ID = "openrouter/anthropic/claude-haiku-4.5"
```

**Free Tier Users** (including BYPASS_TRIAL):
- Default model: `openrouter/moonshotai/kimi-k2` (Kimi K2)

**Paid Tier Users**:
- Default model: `openrouter/anthropic/claude-haiku-4.5` (Claude Haiku 4.5)

## Impact

### Who This Affects

- ✅ **BYPASS_TRIAL users** - Can now create agents
- ✅ **Free tier users** - Can now create agents
- ✅ **Trial users** - Can now create agents
- ✅ **All new users** - Agent creation works

### What This Fixes

1. **Agent Creation** - Users can create new agents ✅
2. **Default Model Assignment** - Free tier gets correct model ✅
3. **Initial Version Creation** - Agent versions created successfully ✅
4. **Suna Agent Creation** - Default Suna agent creation works ✅
5. **User Onboarding** - New users can start using the platform ✅

## Testing

### Test Agent Creation

1. Login as any user (BYPASS_TRIAL, free tier, etc.)
2. Navigate to Agents page
3. Click "Create Agent"
4. Fill in agent details
5. Click "Create"
6. Verify:
   - ✅ Agent created successfully (HTTP 200)
   - ✅ No "Failed to create initial version" error
   - ✅ Agent appears in agent list
   - ✅ Agent has default model assigned (kimi-k2 for free tier)

### Verify Logs

**Success Logs** (should NOT see these errors anymore):
```
❌ "Failed to determine user tier: name 'FREE_MODEL_ID' is not defined"
❌ "Error creating initial version: name 'FREE_MODEL_ID' is not defined"
```

**Normal Logs** (should see):
```
✅ Agent created successfully
✅ Initial version created
✅ Default model assigned
```

## Related Files

- `backend/core/ai_models/manager.py` - ModelManager class (fixed)
- `backend/core/ai_models/registry.py` - Model ID constants defined
- `backend/core/agent_crud.py` - Calls get_default_model_for_user()
- `backend/core/utils/suna_default_agent_service.py` - Creates default Suna agent

## Related Issues

This fix works together with:
- **BYPASS_TRIAL_AGENT_ACCESS_FIX.md** - Ensures Suna agent is created
- **PIPEDREAM_DISABLE_IMPLEMENTATION.md** - Controls Pipedream services

All three fixes ensure:
1. New BYPASS_TRIAL users get credit account ✅
2. New users get default Suna agent ✅  
3. Agents can be created with proper model ✅ (this fix)
4. Users can chat immediately ✅

## Status

✅ **FIXED** - Users can now create agents without "FREE_MODEL_ID not defined" error.

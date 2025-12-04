# Fix Authentication Error After 103 Agent Responses

## Problem
After ~103 agent responses, you see this error:
```
Authentication failed: Please check your API credentials. 
litellm.AuthenticationError: BedrockException Invalid Authentication - Unable to locate credentials
```

Even though `SHOULD_USE_ANTHROPIC = True` is set in `core/ai_models/registry.py`.

## Root Cause
1. **Stale Configuration**: Worker processes have old liteLLM Router configuration with Bedrock fallbacks cached in memory
2. **No AWS Credentials**: boto3 client is initialized without credentials, causing failures when old config tries Bedrock
3. **Process Restart Cycle**: After ~103 calls, worker process or Redis reconnection triggers reinitialization with stale config

## Solution

### Step 1: Verify Database is Clean (✅ DONE)
```bash
cd backend
py -u core\utils\scripts\purge_bedrock_cache.py
```

**Result**: No Bedrock ARNs found in database

### Step 2: Restart All Services (REQUIRED)

**Windows PowerShell:**
```powershell
# Stop all Python processes (API + Workers)
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force

# Or use Ctrl+C in each terminal running services
```

**Then restart services:**
```powershell
# Terminal 1: Start API server
cd C:\Users\Ross\Desktop\om-ait-3\backend
py api.py

# Terminal 2: Start worker (if separate)
py -m dramatiq run_agent_background
```

### Step 3: Verify Configuration

Check that these files have correct settings:

**File: `core/ai_models/registry.py`**
```python
SHOULD_USE_ANTHROPIC = True  # ✅ This should be True

_BASIC_MODEL_ID = "anthropic/claude-sonnet-4-5-20250929" if SHOULD_USE_ANTHROPIC else "bedrock/..."
_POWER_MODEL_ID = "anthropic/claude-sonnet-4-5-20250929" if SHOULD_USE_ANTHROPIC else "bedrock/..."
```

**File: `core/services/llm.py`** (lines 117-127)
```python
# Anthropic-only fallbacks: Retry same model on rate limits/errors
# No Bedrock - we use direct Anthropic API only
fallbacks = [
    {
        "anthropic/claude-sonnet-4-5-20250929": [
            "anthropic/claude-sonnet-4-5-20250929",  # Retry same model
        ]
    }
]
```

**Environment Variables** (`.env` file):
```bash
# REQUIRED: Anthropic API key
ANTHROPIC_API_KEY=sk-ant-...

# NOT NEEDED (we don't use Bedrock):
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_BEARER_TOKEN_BEDROCK=
```

### Step 4: Test
1. Start a new chat session
2. Send 105+ messages to verify no error occurs
3. Monitor logs for:
   - ✅ "Anthropic API key verified"
   - ✅ "Configured LiteLLM Router with Anthropic-only fallback rules"
   - ❌ NO "BedrockException" or "Unable to locate credentials"

## Why This Fixes It

1. **Redis Cache Purged**: Removes any cached agent configs with old model references
2. **Process Restart**: Loads fresh configuration from code
3. **Anthropic-Only**: Router now only uses Anthropic API, never tries Bedrock
4. **No AWS Dependencies**: No boto3 authentication failures

## If Error Persists

### Check 1: Verify ANTHROPIC_API_KEY is set
```powershell
# In PowerShell
$env:ANTHROPIC_API_KEY
# Should show: sk-ant-...
```

### Check 2: Check running processes
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*python*"}
# Kill any old processes and restart clean
```

### Check 3: Clear Redis manually
```powershell
cd backend
py -u core\utils\scripts\purge_bedrock_cache.py
```

### Check 4: Enable debug logging
In `core/services/llm.py`, uncomment:
```python
os.environ['LITELLM_LOG'] = 'DEBUG'
litellm.set_verbose = True
```

This will show exactly which model IDs liteLLM is trying to use.

## Prevention

To avoid this in the future:
1. Always restart services after changing model configuration
2. Run `purge_bedrock_cache.py` after configuration changes
3. Monitor worker processes for memory leaks or connection pool exhaustion
4. Consider adding health checks that restart workers proactively

## Technical Details

**Why 103 calls?**: This number likely corresponds to:
- Redis connection pool reaching max connections (100)
- Worker process memory limit
- Dramatiq worker task count before restart
- Some internal liteLLM cache limit

**The Error Chain**:
1. Worker hits limit → tries to reinitialize
2. Loads stale cached config with Bedrock ARNs
3. liteLLM attempts fallback to Bedrock
4. boto3 has no AWS credentials → AuthenticationError
5. All fallbacks fail → Error propagates to frontend

**The Fix Chain**:
1. Purge Redis cache → Removes stale configs
2. Update code → Anthropic-only fallbacks
3. Restart processes → Loads fresh config
4. Never tries Bedrock → No authentication needed

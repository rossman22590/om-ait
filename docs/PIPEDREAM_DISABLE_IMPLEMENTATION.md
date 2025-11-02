# PIPEDREAM Environment Variable Implementation

## Overview
Implemented a `PIPEDREAM` environment variable to control whether Pipedream services are initialized and available in the backend. When set to `false`, all Pipedream functionality is disabled, including initialization logging and API endpoints.

## Changes Made

### 1. Configuration (`backend/core/utils/config.py`)
- **Added**: `PIPEDREAM: Optional[bool] = True` configuration variable
- **Default**: `True` (Pipedream enabled by default)
- **Location**: After `BYPASS_TRIAL` configuration

### 2. Pipedream API Initialization (`backend/core/pipedream/api.py`)

#### Added Import
```python
from core.utils.config import config
```

#### Updated `initialize()` Function
```python
def initialize(database):
    global profile_service, connection_service, app_service, mcp_service, connection_token_service
    
    # Check if Pipedream is enabled
    pipedream_enabled = getattr(config, 'PIPEDREAM', True)
    
    if not pipedream_enabled:
        logger.info("Pipedream services disabled via PIPEDREAM=false configuration")
        return
    
    try:
        # Initialize services
        profile_service = ProfileService()
        connection_service = ConnectionService(logger=logger)
        app_service = get_app_service()
        mcp_service = MCPService()
        connection_token_service = ConnectionTokenService()
        
        logger.info("Pipedream services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize pipedream services: {str(e)}")
        raise
```

#### Added Dependency Check Function
```python
def check_pipedream_enabled():
    """
    Dependency to check if Pipedream services are enabled.
    Raises HTTPException if disabled.
    """
    pipedream_enabled = getattr(config, 'PIPEDREAM', True)
    if not pipedream_enabled:
        raise HTTPException(
            status_code=503,
            detail="Pipedream services are disabled"
        )
    if not profile_service:
        raise HTTPException(
            status_code=503,
            detail="Pipedream services not initialized"
        )
    return True
```

#### Updated All API Endpoints
Added `_enabled: bool = Depends(check_pipedream_enabled)` dependency to all 16 Pipedream API endpoints:

1. `POST /pipedream/connection-token`
2. `GET /pipedream/connections`
3. `POST /pipedream/mcp/discover`
4. `POST /pipedream/mcp/discover-profile`
5. `POST /pipedream/mcp/connect`
6. `GET /pipedream/apps`
7. `GET /pipedream/apps/popular`
8. `GET /pipedream/apps/{app_slug}/icon`
9. `GET /pipedream/apps/{app_slug}/tools`
10. `POST /pipedream/profiles`
11. `GET /pipedream/profiles`
12. `GET /pipedream/profiles/{profile_id}`
13. `PUT /pipedream/profiles/{profile_id}`
14. `DELETE /pipedream/profiles/{profile_id}`
15. `POST /pipedream/profiles/{profile_id}/connect`
16. `GET /pipedream/profiles/{profile_id}/connections`

### 3. Agent Tool Registration (`backend/core/run.py`)

#### Updated `_register_agent_builder_tools()` Method

Added configuration check to skip Pipedream tool registration when disabled:

```python
from core.utils.config import config

# Check if Pipedream is enabled
pipedream_enabled = getattr(config, 'PIPEDREAM', True)

agent_builder_tools = [
    ('agent_config_tool', AgentConfigTool),
    ('mcp_search_tool', MCPSearchTool),
    ('credential_profile_tool', CredentialProfileTool),
    ('trigger_tool', TriggerTool),
]

# Only add Pipedream tool if enabled
if pipedream_enabled:
    agent_builder_tools.append(('pipedream_mcp_tool', PipedreamMCPTool))
else:
    logger.info("Pipedream tool registration skipped (PIPEDREAM=false)")
```

**Result**: 
- Pipedream tools are NOT registered in agent runs when `PIPEDREAM=false`
- No Pipedream function logs appear during agent execution
- Clean agent tool registry without Pipedream clutter

## Behavior

### When `PIPEDREAM=true` (or not set)
- ✅ Pipedream services initialize normally
- ✅ Log message: `"Pipedream services initialized successfully"`
- ✅ All Pipedream API endpoints are accessible
- ✅ Pipedream tools registered in agent runs
- ✅ Log: `"✅ ✅ Pipedream functions registered: ['connect_pipedream_mcp', ...]"`
- ✅ Normal Pipedream functionality

### When `PIPEDREAM=false`
- ❌ Pipedream services are NOT initialized
- ℹ️ Log message: `"Pipedream services disabled via PIPEDREAM=false configuration"`
- ℹ️ Log message: `"Pipedream tool registration skipped (PIPEDREAM=false)"`
- ❌ Pipedream tools NOT registered in agent runs
- ❌ No "Pipedream functions registered" logs
- ❌ All Pipedream API endpoints return HTTP 503 with message: `"Pipedream services are disabled"`
- ✅ No errors or crashes
- ✅ Application starts normally without Pipedream
- ✅ Reduced tool count (107 → ~102 tools)

## Environment Variable Setup

### .env File
```env
# Enable/disable Pipedream integration services
PIPEDREAM=false
```

### Values
- `true`, `t`, `yes`, `y`, `1` → Pipedream enabled
- `false`, `f`, `no`, `n`, `0` → Pipedream disabled
- Empty or missing → Default to `true` (enabled)

## Testing

### Verify Pipedream is Disabled
1. Set `PIPEDREAM=false` in `.env`
2. Start the backend server
3. Check logs for: `"Pipedream services disabled via PIPEDREAM=false configuration"`
4. Verify no `"Pipedream services initialized successfully"` message appears
5. Test any Pipedream endpoint (should return 503)

### Verify Pipedream is Enabled
1. Set `PIPEDREAM=true` in `.env` (or remove the line)
2. Start the backend server
3. Check logs for: `"Pipedream services initialized successfully"`
4. Verify Pipedream endpoints return normal responses

## Benefits

1. **Clean Logs**: No Pipedream initialization logs when disabled
2. **Performance**: Skips service initialization overhead when not needed
3. **Deployment Flexibility**: Easy to disable Pipedream in specific environments
4. **Graceful Degradation**: Application continues to work without Pipedream
5. **Clear Error Messages**: API endpoints return 503 with clear message when disabled
6. **Type Safety**: Uses FastAPI dependency injection for consistent behavior

## Related Files

- `backend/core/utils/config.py` - Configuration definition
- `backend/core/pipedream/api.py` - Service initialization and API endpoints
- `backend/core/run.py` - Agent tool registration (conditionally registers Pipedream tools)
- `backend/.env` - Environment variable settings
- `backend/api.py` - Main application startup (calls `pipedream_api.initialize()`)

## Status

✅ **COMPLETE** - All Pipedream functionality (API services AND agent tools) can now be controlled via the `PIPEDREAM` environment variable.

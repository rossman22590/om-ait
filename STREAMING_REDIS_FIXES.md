# Streaming Connection Fixes (Frontend Only)

## Problem Statement
Chat was getting "stuck" and sometimes requiring page refresh to get AI to respond.

## Root Causes Identified

1. **EventSource Auto-Reconnection Killed Prematurely**
   - Old code immediately cleaned up stream on any error
   - EventSource has built-in reconnection but wasn't allowed to use it
   - Result: Connection drops → user must refresh

2. **Stuck Connection Not Detected**
   - No timeout mechanism for streams stuck in "connecting" state
   - Agent running but stream never transitions to "streaming"
   - Result: Infinite loading spinner

## Fixes Applied (Frontend Only - Zero Backend Risk)

### Fix 1: EventSource Reconnection Support
**File**: `frontend/src/lib/api/agents.ts`

**Before**:
```typescript
eventSource.onerror = (event) => {
  // Immediately check status and cleanup
  getAgentStatus(agentRunId).then(...)
}
```

**After**:
```typescript
eventSource.onerror = (event) => {
  const readyState = eventSource.readyState;
  
  // Let EventSource auto-reconnect if it's trying
  if (readyState === EventSource.CONNECTING) {
    console.log('EventSource reconnecting, waiting...');
    return; // Don't cleanup - let it reconnect
  }
  
  // Only cleanup if truly failed
  getAgentStatus(agentRunId).then(status => {
    if (status.status === 'running') {
      // Still running - let EventSource auto-reconnect
      console.log('Agent still running, EventSource will auto-reconnect');
    } else {
      // Cleanup
    }
  })
}
```

**Impact**: Network hiccups and temporary connection drops now auto-recover instead of requiring refresh.

---

### Fix 2: Stuck Connection Detection & Recovery
**File**: `frontend/src/hooks/messages/useAgentStream.ts`

**Before**:
```typescript
setTimeout(async () => {
  if (statusRef.current === 'streaming') return;
  const latest = await getAgentStatus(runId);
  if (latest.status !== 'running') {
    finalizeStream(mapAgentStatus(latest.status), runId);
  }
}, 1500);
```

**After**:
```typescript
setTimeout(async () => {
  if (statusRef.current === 'streaming') return;
  
  const latest = await getAgentStatus(runId);
  if (latest.status !== 'running') {
    finalizeStream(mapAgentStatus(latest.status), runId);
  } else if (statusRef.current === 'connecting') {
    // Agent running but stream stuck - force reconnect
    console.warn('Stream stuck in connecting, forcing reconnect...');
    
    // Kill stuck stream
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    
    // Retry with fresh connection
    setTimeout(() => startStreaming(runId), 100);
  }
}, 1500);
```

**Impact**: Stuck streams automatically detected and retried after 1.5 seconds.

---

## Testing Scenarios

### Scenario 1: Network Hiccup
- **Before**: Stream dies → user refreshes → works
- **After**: EventSource auto-reconnects → seamless recovery

### Scenario 2: Stuck Connection
- **Before**: Loading spinner forever → user refreshes
- **After**: Auto-detected after 1.5s → auto-retry → connects



## Expected Results

✅ **No more stuck chats** - Auto-recovery from connection issues  
✅ **No more required refreshes** - EventSource reconnection works  
✅ **Zero backend risk** - Only frontend changes, no impact on agent execution  

## Monitoring

Look for these log patterns in production:

**Good Signs** (browser console):
- `[STREAM] EventSource reconnecting for {agentRunId}, waiting...`
- `[STREAM] Agent {agentRunId} still running, EventSource will auto-reconnect`
- `[useAgentStream] No messages received after 1.5s for {runId}, checking agent status...`
- `[useAgentStream] Stream stuck in connecting, forcing reconnect...`
- `[useAgentStream] Retrying stream connection for {runId}...`

## Deployment Notes

1. **Frontend only changes** - Zero backend risk, no agent execution logic modified
2. **No breaking changes** - All fixes are backwards compatible
3. **No config changes required** - Uses existing EventSource configuration
4. **Immediate impact** - Frontend hot reload, no server restart needed
5. **Fallback behavior** - All errors have graceful fallbacks

## Future Improvements

Consider adding:
1. Exponential backoff for stream retries (currently fixed 100ms)
2. Metrics/alerts for reconnection frequency
3. User-visible reconnection indicator (optional)

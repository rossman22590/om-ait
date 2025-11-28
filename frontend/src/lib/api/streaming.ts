// Streaming utilities for agent runs

// Set to keep track of agent runs that are known to be non-running
// IMPORTANT: This set should be periodically cleaned to prevent memory leaks
export const nonRunningAgentRuns = new Set<string>();
// Map to keep track of active EventSource streams
export const activeStreams = new Map<string, EventSource>();

// Maximum size for nonRunningAgentRuns set to prevent memory leaks
const MAX_NON_RUNNING_CACHE_SIZE = 100;

/**
 * Clear a specific agent run from the non-running cache
 * Call this when starting a new agent run to ensure fresh state
 */
export const clearNonRunningAgent = (agentRunId: string): void => {
  nonRunningAgentRuns.delete(agentRunId);
};

/**
 * Prune the nonRunningAgentRuns set if it gets too large
 * This prevents memory leaks from accumulating old run IDs
 */
export const pruneNonRunningCache = (): void => {
  if (nonRunningAgentRuns.size > MAX_NON_RUNNING_CACHE_SIZE) {
    // Clear oldest entries (Set maintains insertion order)
    const entries = Array.from(nonRunningAgentRuns);
    const toRemove = entries.slice(0, entries.length - MAX_NON_RUNNING_CACHE_SIZE / 2);
    toRemove.forEach(id => nonRunningAgentRuns.delete(id));
    console.log(`[STREAM] Pruned ${toRemove.length} old entries from nonRunningAgentRuns cache`);
  }
};

/**
 * Helper function to safely cleanup EventSource connections
 * This ensures consistent cleanup and prevents memory leaks
 */
export const cleanupEventSource = (agentRunId: string, reason?: string): void => {
  const stream = activeStreams.get(agentRunId);
  if (stream) {
    if (reason) {
      console.log(`[STREAM] Cleaning up EventSource for ${agentRunId}: ${reason}`);
    }
    
    // Close the connection
    if (stream.readyState !== EventSource.CLOSED) {
      stream.close();
    }
    
    // Remove from active streams
    activeStreams.delete(agentRunId);
  }
};

/**
 * Failsafe cleanup function to prevent memory leaks
 * Should be called periodically or during app teardown
 */
export const cleanupAllEventSources = (reason = 'batch cleanup'): void => {
  console.log(`[STREAM] Running batch cleanup: ${activeStreams.size} active streams`);
  
  const streamIds = Array.from(activeStreams.keys());
  streamIds.forEach(agentRunId => {
    cleanupEventSource(agentRunId, reason);
  });
};


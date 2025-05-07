import { useState, useEffect, useRef, useCallback } from 'react';
import {
  streamAgent,
  getAgentStatus,
  stopAgent,
  AgentRun,
  getMessages,
  startAgent,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  UnifiedMessage,
  ParsedContent,
  ParsedMetadata,
} from '@/components/thread/types';
import { safeJsonParse } from '@/components/thread/utils';

interface ApiMessageType {
  message_id?: string;
  thread_id?: string;
  type: string;
  is_llm_message?: boolean;
  content: string;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

// Define the structure returned by the hook
export interface UseAgentStreamResult {
  status: string;
  textContent: string;
  toolCall: ParsedContent | null;
  error: string | null;
  agentRunId: string | null; // Expose the currently managed agentRunId
  startStreaming: (runId: string) => void;
  stopStreaming: () => Promise<void>;
}

// Define the callbacks the hook consumer can provide
export interface AgentStreamCallbacks {
  onMessage: (message: UnifiedMessage) => void; // Callback for complete messages
  onStatusChange?: (status: string) => void; // Optional: Notify on internal status changes
  onError?: (error: string) => void; // Optional: Notify on errors
  onClose?: (finalStatus: string) => void; // Optional: Notify when streaming definitively ends
  onAssistantStart?: () => void; // Optional: Notify when assistant starts streaming
  onAssistantChunk?: (chunk: { content: string }) => void; // Optional: Notify on each assistant message chunk
}

// Helper function to map API messages to UnifiedMessages
const mapApiMessagesToUnified = (
  messagesData: ApiMessageType[] | null | undefined,
  currentThreadId: string,
): UnifiedMessage[] => {
  return (messagesData || [])
    .filter((msg) => msg.type !== 'status')
    .map((msg: ApiMessageType) => ({
      message_id: msg.message_id || null,
      thread_id: msg.thread_id || currentThreadId,
      type: (msg.type || 'system') as UnifiedMessage['type'],
      is_llm_message: Boolean(msg.is_llm_message),
      content: msg.content || '',
      metadata: msg.metadata || '{}',
      created_at: msg.created_at || new Date().toISOString(),
      updated_at: msg.updated_at || new Date().toISOString(),
    }));
};

export function useAgentStream(
  callbacks: AgentStreamCallbacks,
  threadId: string,
  setMessages: (messages: UnifiedMessage[]) => void,
): UseAgentStreamResult {
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [textContent, setTextContent] = useState<string>('');
  const [toolCall, setToolCall] = useState<ParsedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamCleanupRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentRunIdRef = useRef<string | null>(null); // Ref to track the run ID being processed
  const threadIdRef = useRef(threadId); // Ref to hold the current threadId
  const setMessagesRef = useRef(setMessages); // Ref to hold the setMessages function
  const lastActivityTimestampRef = useRef<number>(Date.now()); // Track when we last received activity
  const deadAgentTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for checking dead agents

  // Update refs if threadId or setMessages changes
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    setMessagesRef.current = setMessages;
  }, [setMessages]);

  // Helper function to map backend status to frontend status string
  const mapAgentStatus = (backendStatus: string): string => {
    switch (backendStatus) {
      case 'completed':
        return 'completed';
      case 'stopped':
        return 'stopped';
      case 'failed':
        return 'failed';
      default:
        return 'error';
    }
  };

  // Internal function to update status and notify consumer
  const updateStatus = useCallback(
    (newStatus: string) => {
      if (isMountedRef.current) {
        setStatus(newStatus);
        callbacks.onStatusChange?.(newStatus);
        if (newStatus === 'error' && error) {
          callbacks.onError?.(error);
        }
        if (
          [
            'completed',
            'stopped',
            'failed',
            'error',
            'agent_not_running',
          ].includes(newStatus)
        ) {
          callbacks.onClose?.(newStatus);
        }
      }
    },
    [callbacks, error],
  ); // Include error dependency

  // Function to update the activity timestamp whenever the agent shows signs of life
  const updateActivityTimestamp = useCallback(() => {
    lastActivityTimestampRef.current = Date.now();
  }, []);

  // Set up a dead agent detector that will restart if nothing happens for a while
  const setupDeadAgentDetector = useCallback(() => {
    // Clear any existing timeout
    if (deadAgentTimeoutRef.current) {
      clearTimeout(deadAgentTimeoutRef.current);
      deadAgentTimeoutRef.current = null;
    }

    // Only set up detector if we're in a 'connecting' or 'streaming' state
    if (status !== 'connecting' && status !== 'streaming') return;

    deadAgentTimeoutRef.current = setTimeout(() => {
      // Check if we're still mounted and there's an active run
      if (!isMountedRef.current || !currentRunIdRef.current) return;

      // Calculate how long it's been since the last activity
      const timeSinceLastActivity = Date.now() - lastActivityTimestampRef.current;
      
      // If no activity for 30 seconds while supposedly running, consider it dead
      if (timeSinceLastActivity > 30000 && (status === 'connecting' || status === 'streaming')) {
        console.warn(`[useAgentStream] Detected potential dead agent - no activity for ${Math.round(timeSinceLastActivity/1000)}s. Attempting recovery.`);
        toast.warning("Agent appears to be unresponsive. Attempting to restart...");
        
        // Try to finalize the stream with an error status which will trigger restart logic
        setError("Agent unresponsive - no activity detected for 30 seconds");
        finalizeStream('error', currentRunIdRef.current, true); // Force restart
      } else {
        // Still active, check again in 10 seconds
        setupDeadAgentDetector();
      }
    }, 10000); // Check every 10 seconds
  }, [status]);  // Re-setup when status changes

  // Helper function to restart the agent on specific failures
  const restartAgent = useCallback(async (retryCount = 0, delayMs = 1000) => {
    if (!isMountedRef.current || !threadIdRef.current) return;
    
    // Clear any dead agent detection
    if (deadAgentTimeoutRef.current) {
      clearTimeout(deadAgentTimeoutRef.current);
      deadAgentTimeoutRef.current = null;
    }
    
    console.log(`[useAgentStream] Attempting to restart agent for thread ${threadIdRef.current} (retry #${retryCount})`);
    
    // Only show toast on first retry to avoid spamming
    if (retryCount === 0) {
      toast.info('Agent encountered an issue. Automatically restarting...', {
        duration: 3000,
      });
    }
    
    // Add a delay before restarting to allow any backend processes to clean up
    // Use exponential backoff for retries (1s, 2s, 4s)
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    try {
      // Clear state first
      setStatus('idle');
      setTextContent('');
      setToolCall(null);
      setError(null);
      setAgentRunId(null);
      currentRunIdRef.current = null;
      
      // Reset activity timestamp
      updateActivityTimestamp();
      
      // Start a new agent run
      const { agent_run_id } = await startAgent(threadIdRef.current, {
        stream: true,
      });
      
      if (isMountedRef.current) {
        console.log(`[useAgentStream] Successfully started new agent run: ${agent_run_id}`);
        // We need to use the startStreaming function which will be defined later
        // This is safe because restartAgent's deps array will include startStreaming
        startStreaming(agent_run_id);
        
        // Setup a safeguard in case this new agent also goes silent
        setTimeout(() => {
          if (isMountedRef.current && currentRunIdRef.current === agent_run_id && status === 'connecting') {
            console.warn(`[useAgentStream] New agent ${agent_run_id} didn't progress beyond connecting state. Taking corrective action.`);
            if (retryCount < 3) { // Increased retry limit from 2 to 3
              // Try more restarts with exponential backoff
              const nextDelay = delayMs * 2; // Double the delay each time
              restartAgent(retryCount + 1, nextDelay);
            } else {
              // We've tried multiple times, give up and show error
              setError("Agent failed to respond after multiple restart attempts. You can try again or refresh the page.");
              updateStatus('error');
              toast.error("Unable to get a response from the agent after multiple attempts", {
                description: "You can try sending your message again or refreshing the page.",
                action: {
                  label: "Try Again",
                  onClick: () => {
                    // Reset everything and try once more
                    setError(null);
                    setStatus('idle');
                    restartAgent(0, 0); // Start fresh with no delay
                  }
                }
              });
            }
          }
        }, 15000); // Wait 15 seconds for the agent to start responding
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[useAgentStream] Failed to restart agent: ${errorMessage}`);
      
      // Check if this is the pathToRegexp error or other 500 error that's worth retrying
      const isPathToRegexpError = errorMessage.includes('pathToRegexpError') || 
                                 (errorMessage.includes('500') && errorMessage.includes('Failed to initialize sandbox'));
      const isServerError = errorMessage.includes('500');
      
      if ((isPathToRegexpError || isServerError) && retryCount < 3) {
        // This is a retriable error, try again with backoff
        console.warn(`[useAgentStream] Detected server error, will retry again (${retryCount + 1}/3)`);
        const nextDelay = delayMs * 2; // Double the delay each time
        setTimeout(() => {
          restartAgent(retryCount + 1, nextDelay);
        }, nextDelay);
      } else if (retryCount >= 3) {
        // We've tried enough times, show a permanent error
        toast.error("Unable to start agent after multiple attempts", {
          description: "You can try sending your message again or refreshing the page.",
          action: {
            label: "Try Again",
            onClick: () => {
              // Reset everything and try once more
              setError(null);
              setStatus('idle');
              restartAgent(0, 0); // Start fresh with no delay
            }
          }
        });
        updateStatus('error');
        setError(`Failed to start agent after multiple attempts: ${errorMessage}`);
      } else {
        // Other non-retriable error
        toast.error(`Could not restart the agent: ${errorMessage}`);
        updateStatus('error');
        setError(`Failed to restart agent: ${errorMessage}`);
      }
    }
  }, []); // Empty deps array for now, will be filled later after all functions are defined

  // Function to handle finalization of a stream (completion, stop, error)
  const finalizeStream = useCallback(
    (finalStatus: string, runId: string | null = agentRunId, shouldAttemptRestart = false) => {
      if (!isMountedRef.current) return;

      // Clear any dead agent detection
      if (deadAgentTimeoutRef.current) {
        clearTimeout(deadAgentTimeoutRef.current);
        deadAgentTimeoutRef.current = null;
      }

      const currentThreadId = threadIdRef.current; // Get current threadId from ref
      const currentSetMessages = setMessagesRef.current; // Get current setMessages from ref

      console.log(
        `[useAgentStream] Finalizing stream for ${runId} on thread ${currentThreadId} with status: ${finalStatus}`,
      );

      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }

      // Reset streaming-specific state
      setTextContent('');
      setToolCall(null);

      // Update status and clear run ID
      updateStatus(finalStatus);
      setAgentRunId(null);
      currentRunIdRef.current = null;

      // --- Reliable Message Refetch on Finalization ---
      // Only refetch if the stream ended with a terminal status indicating the run is likely over
      const terminalStatuses = [
        'completed',
        'stopped',
        'failed',
        'error',
        'agent_not_running',
      ];
      if (currentThreadId && terminalStatuses.includes(finalStatus)) {
        console.log(
          `[useAgentStream] Refetching messages for thread ${currentThreadId} after finalization with status ${finalStatus}.`,
        );
        getMessages(currentThreadId)
          .then((messagesData: ApiMessageType[]) => {
            if (isMountedRef.current && messagesData) {
              console.log(
                `[useAgentStream] Refetched ${messagesData.length} messages for thread ${currentThreadId}.`,
              );
              const unifiedMessages = mapApiMessagesToUnified(
                messagesData,
                currentThreadId,
              );
              currentSetMessages(unifiedMessages); // Use the ref'd setMessages
            } else if (!isMountedRef.current) {
              console.log(
                `[useAgentStream] Component unmounted before messages could be set after refetch for thread ${currentThreadId}.`,
              );
            }
          })
          .catch((err) => {
            console.error(
              `[useAgentStream] Error refetching messages for thread ${currentThreadId} after finalization:`,
              err,
            );
            // Optionally notify the user via toast or callback
            toast.error(`Failed to refresh messages: ${err.message}`);
          });
      } else {
        console.log(
          `[useAgentStream] Skipping message refetch for thread ${currentThreadId}. Final status: ${finalStatus}`,
        );
      }

      // If the run was stopped or completed, try to get final status to update nonRunning set (keep this)
      if (
        runId &&
        (finalStatus === 'completed' ||
          finalStatus === 'stopped' ||
          finalStatus === 'agent_not_running')
      ) {
        getAgentStatus(runId).catch((err) => {
          console.log(
            `[useAgentStream] Post-finalization status check for ${runId} failed (this might be expected if not found): ${err.message}`,
          );
        });
      }
      
      // Check if auto-restart should be triggered for certain errors
      if (shouldAttemptRestart || (finalStatus === 'error' && error && (
          error.includes('time limit') ||
          error.includes('OTOL') ||
          error.includes('out of time') ||
          error.includes('timeout') ||
          error.includes('timed out') ||
          error.includes('scrape failed') ||
          error.includes('web scraping error')
        ))) {
        console.log(`[useAgentStream] Detected potentially recoverable error: "${error}". Attempting to restart.`);
        // Small delay to ensure everything is cleaned up before restart
        setTimeout(() => {
          restartAgent();
        }, 1000);
      }
    },
    [agentRunId, updateStatus],
  );

  // --- Stream Callback Handlers ---

  const handleStreamMessage = useCallback(
    (rawData: string) => {
      if (!isMountedRef.current) return;
      (window as any).lastStreamMessage = Date.now(); // Keep track of last message time
      updateActivityTimestamp(); // Update our activity timestamp

      let processedData = rawData;
      if (processedData.startsWith('data: ')) {
        processedData = processedData.substring(6).trim();
      }
      if (!processedData) return;

      // --- Early exit for non-JSON completion messages ---
      if (
        processedData ===
        '{"type": "status", "status": "completed", "message": "Agent run completed successfully"}'
      ) {
        console.log(
          '[useAgentStream] Received final completion status message',
        );
        finalizeStream('completed', currentRunIdRef.current);
        return;
      }
      if (
        processedData.includes('Run data not available for streaming') ||
        processedData.includes('Stream ended with status: completed')
      ) {
        console.log(
          `[useAgentStream] Detected final completion message: "${processedData}", finalizing.`,
        );
        finalizeStream('completed', currentRunIdRef.current);
        return;
      }

      // --- Process JSON messages ---
      const message: UnifiedMessage = safeJsonParse(processedData, null);
      if (!message) {
        console.warn(
          '[useAgentStream] Failed to parse streamed message:',
          processedData,
        );
        return;
      }

      const parsedContent = safeJsonParse<ParsedContent>(message.content, {});
      const parsedMetadata = safeJsonParse<ParsedMetadata>(
        message.metadata,
        {},
      );

      // Update status to streaming if we receive a valid message
      if (status !== 'streaming') updateStatus('streaming');

      switch (message.type) {
        case 'assistant':
          if (
            parsedMetadata.stream_status === 'chunk' &&
            parsedContent.content
          ) {
            setTextContent((prev) => prev + parsedContent.content);
            callbacks.onAssistantChunk?.({ content: parsedContent.content });
          } else if (parsedMetadata.stream_status === 'complete') {
            setTextContent('');
            setToolCall(null);
            if (message.message_id) callbacks.onMessage(message);
          } else if (!parsedMetadata.stream_status) {
            // Handle non-chunked assistant messages if needed
            callbacks.onAssistantStart?.();
            if (message.message_id) callbacks.onMessage(message);
          }
          break;
        case 'tool':
          setToolCall(null); // Clear any streaming tool call
          if (message.message_id) callbacks.onMessage(message);
          break;
        case 'status':
          switch (parsedContent.status_type) {
            case 'tool_started':
              setToolCall({
                role: 'assistant',
                status_type: 'tool_started',
                name: parsedContent.function_name,
                arguments: parsedContent.arguments,
                xml_tag_name: parsedContent.xml_tag_name,
                tool_index: parsedContent.tool_index,
              });
              break;
            case 'tool_completed':
            case 'tool_failed':
            case 'tool_error':
              if (toolCall?.tool_index === parsedContent.tool_index) {
                setToolCall(null);
              }
              break;
            case 'thread_run_end':
              console.log(
                '[useAgentStream] Received thread run end status, finalizing.',
              );
              break;
            case 'finish':
              // Optional: Handle finish reasons like 'xml_tool_limit_reached'
              console.log(
                '[useAgentStream] Received finish status:',
                parsedContent.finish_reason,
              );
              // Don't finalize here, wait for thread_run_end or completion message
              break;
            case 'error':
              console.error(
                '[useAgentStream] Received error status message:',
                parsedContent.message,
              );
              const errorMsg = parsedContent.message || 'Agent run failed';
              setError(errorMsg);
              // Check if this is a time limit related error that needs auto-restart
              const isTimeoutError = errorMsg.includes('time limit') || 
                                    errorMsg.includes('OTOL') || 
                                    errorMsg.includes('out of time') || 
                                    errorMsg.includes('timeout') || 
                                    errorMsg.includes('timed out') ||
                                    errorMsg.includes('scrape failed') ||
                                    errorMsg.includes('web scraping error');
              
              finalizeStream('error', currentRunIdRef.current, isTimeoutError);
              break;
            // Ignore thread_run_start, assistant_response_start etc. for now
            default:
              // console.debug('[useAgentStream] Received unhandled status type:', parsedContent.status_type);
              break;
          }
          break;
        case 'user':
        case 'system':
          // Handle other message types if necessary, e.g., if backend sends historical context
          if (message.message_id) callbacks.onMessage(message);
          break;
        default:
          console.warn(
            '[useAgentStream] Unhandled message type:',
            message.type,
          );
      }
    },
    [
      threadId,
      setMessages,
      status,
      toolCall,
      callbacks,
      finalizeStream,
      updateStatus,
    ],
  );

  const handleStreamError = useCallback(
    (err: Error | string | Event) => {
      if (!isMountedRef.current) return;

      // Extract error message
      let errorMessage = 'Unknown streaming error';
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err instanceof Event && err.type === 'error') {
        // Standard EventSource errors don't have much detail, might need status check
        errorMessage = 'Stream connection error';
      }

      console.error('[useAgentStream] Streaming error:', errorMessage, err);
      setError(errorMessage);

      const runId = currentRunIdRef.current;
      if (!runId) {
        console.warn(
          '[useAgentStream] Stream error occurred but no agentRunId is active.',
        );
        finalizeStream('error'); // Finalize with generic error if no runId
        return;
      }

      // Check agent status immediately after an error
      getAgentStatus(runId)
        .then((agentStatus) => {
          if (!isMountedRef.current) return; // Check mount status again after async call

          if (agentStatus.status === 'running') {
            console.warn(
              `[useAgentStream] Stream error for ${runId}, but agent is still running. Finalizing with error.`,
            );
            setError('Stream interrupted while agent was running');
            finalizeStream('error', runId); // Stream failed, even if agent might still be running backend-side
            toast.warning('Stream interrupted. Agent might still be running.');
          } else {
            // Map backend terminal status to hook terminal status
            const finalStatus = mapAgentStatus(agentStatus.status);
            console.log(
              `[useAgentStream] Stream error for ${runId}, agent status is ${agentStatus.status}. Finalizing stream as ${finalStatus}.`,
            );
            // Check if it's an error that warrants auto-restart
            const shouldRestart = errorMessage && (
                errorMessage.includes('time limit') || 
                errorMessage.includes('OTOL') || 
                errorMessage.includes('out of time') || 
                errorMessage.includes('timeout') || 
                errorMessage.includes('timed out') ||
                errorMessage.includes('scrape failed') ||
                errorMessage.includes('web scraping error')
            );
            
            // Check for common "not running" messages that aren't actual errors
            const isNotRunningError = errorMessage.includes('not running') || 
                                  errorMessage.includes('is already stopped') ||
                                  errorMessage.includes('terminated');
            
            if (!isNotRunningError) {
              finalizeStream(finalStatus, runId, shouldRestart);
            } else {
              console.log(
                `[useAgentStream] Agent run ${runId} not running after stream error. Finalizing.`,
              );
              finalizeStream('agent_not_running', runId);
            }
          }
        })
        .catch((statusError) => {
          if (!isMountedRef.current) return;

          const statusErrorMessage =
            statusError instanceof Error
              ? statusError.message
              : String(statusError);
          
          // Check for common "not running" messages that aren't actual errors
          const isNotRunningError = statusErrorMessage.includes('not running') || 
                                statusErrorMessage.includes('is already stopped') ||
                                statusErrorMessage.includes('terminated');
          
          const isNotFoundError =
            statusErrorMessage.includes('not found') ||
            statusErrorMessage.includes('404') ||
            statusErrorMessage.includes('does not exist');

          // Only log as error if it's not a common "not running" case
          if (!isNotRunningError && !isNotFoundError) {
            console.error(
              `[useAgentStream] Error checking agent status for ${runId} after stream error: ${statusErrorMessage}`,
            );
          } else {
            // Log as info instead for common cases
            console.log(
              `[useAgentStream] Agent run ${runId} not available after stream error: ${statusErrorMessage}`,
            );
          }

          if (isNotFoundError || isNotRunningError) {
            console.log(
              `[useAgentStream] Agent run ${runId} not found or no longer running after stream error. Finalizing.`,
            );
            // Revert to agent_not_running for these cases
            finalizeStream('agent_not_running', runId);
          } else {
            // For other status check errors, finalize with the original stream error
            finalizeStream('error', runId);
          }
        });
    },
    [finalizeStream],
  );

  const handleStreamClose = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log('[useAgentStream] Stream connection closed by server.');

    const runId = currentRunIdRef.current;
    if (!runId) {
      console.warn('[useAgentStream] Stream closed but no active agentRunId.');
      // If status was streaming, something went wrong, finalize as error
      if (status === 'streaming' || status === 'connecting') {
        finalizeStream('error');
      } else if (
        status !== 'idle' &&
        status !== 'completed' &&
        status !== 'stopped' &&
        status !== 'agent_not_running'
      ) {
        // If in some other state, just go back to idle if no runId
        finalizeStream('idle');
      }
      return;
    }

    // Immediately check the agent status when the stream closes unexpectedly
    // This covers cases where the agent finished but the final message wasn't received,
    // or if the agent errored out on the backend.
    getAgentStatus(runId)
      .then((agentStatus) => {
        if (!isMountedRef.current) return; // Check mount status again

        console.log(
          `[useAgentStream] Agent status after stream close for ${runId}: ${agentStatus.status}`,
        );
        if (agentStatus.status === 'running') {
          console.warn(
            `[useAgentStream] Stream closed for ${runId}, but agent is still running. Finalizing with error.`,
          );
          setError('Stream closed unexpectedly while agent was running.');
          finalizeStream('error', runId); // Finalize as error for now
          toast.warning('Stream disconnected. Agent might still be running.');
        } else {
          // Map backend terminal status to hook terminal status
          const finalStatus = mapAgentStatus(agentStatus.status);
          console.log(
            `[useAgentStream] Stream closed for ${runId}, agent status is ${agentStatus.status}. Finalizing stream as ${finalStatus}.`,
          );
          finalizeStream(finalStatus, runId);
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;

        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Check for common "not running" messages that aren't actual errors
        const isNotRunningError = errorMessage.includes('not running') || 
                              errorMessage.includes('is already stopped') ||
                              errorMessage.includes('terminated');
        
        if (!isNotRunningError) {
          console.error(
            `[useAgentStream] Error checking agent status for ${runId} after stream close: ${errorMessage}`,
          );
          finalizeStream('error', runId);
        } else {
          console.log(
            `[useAgentStream] Agent run ${runId} not running after stream close. Finalizing.`,
          );
          finalizeStream('agent_not_running', runId);
        }
      });
  }, [status, finalizeStream]); // Include status

  // Effect to manage the dead agent detector when status changes
  useEffect(() => {
    // When status changes to connecting or streaming, set up the dead agent detector
    if (status === 'connecting' || status === 'streaming') {
      updateActivityTimestamp(); // Reset timestamp when status changes
      setupDeadAgentDetector();
    }
    
    return () => {
      // Clean up the timeout when status changes or component unmounts
      if (deadAgentTimeoutRef.current) {
        clearTimeout(deadAgentTimeoutRef.current);
        deadAgentTimeoutRef.current = null;
      }
    };
  }, [status, setupDeadAgentDetector, updateActivityTimestamp]);

  // --- Effect to manage the stream lifecycle ---
  useEffect(() => {
    isMountedRef.current = true;
    lastActivityTimestampRef.current = Date.now(); // Initialize timestamp

    // Cleanup function for when the component unmounts or agentRunId changes
    return () => {
      isMountedRef.current = false;
      console.log(
        '[useAgentStream] Unmounting or agentRunId changing. Cleaning up stream.',
      );
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
      // Clear any dead agent detection
      if (deadAgentTimeoutRef.current) {
        clearTimeout(deadAgentTimeoutRef.current);
        deadAgentTimeoutRef.current = null;
      }
      // Reset state on unmount if needed, though finalizeStream should handle most cases
      setStatus('idle');
      setTextContent('');
      setToolCall(null);
      setError(null);
      setAgentRunId(null);
      currentRunIdRef.current = null;
    };
  }, []); // Empty dependency array for mount/unmount effect

  // --- Public Functions ---

  const startStreaming = useCallback(
    async (runId: string) => {
      if (!isMountedRef.current) return;
      console.log(
        `[useAgentStream] Received request to start streaming for ${runId}`,
      );

      // Clean up any previous stream
      if (streamCleanupRef.current) {
        console.log(
          '[useAgentStream] Cleaning up existing stream before starting new one.',
        );
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
      
      // Clear any existing dead agent detection
      if (deadAgentTimeoutRef.current) {
        clearTimeout(deadAgentTimeoutRef.current);
        deadAgentTimeoutRef.current = null;
      }

      // Reset activity timestamp
      updateActivityTimestamp();

      // Reset state before starting
      setTextContent('');
      setToolCall(null);
      setError(null);
      updateStatus('connecting');
      setAgentRunId(runId);
      currentRunIdRef.current = runId; // Set the ref immediately
      
      // Setup an initial connection timeout to detect if agent doesn't start
      const initialConnectionTimeout = setTimeout(() => {
        if (isMountedRef.current && currentRunIdRef.current === runId && status === 'connecting') {
          console.warn(`[useAgentStream] Agent ${runId} hasn't moved past connecting state in 20 seconds. Attempting recovery.`);
          setError("Connection to agent timed out");
          finalizeStream('error', runId, true); // Force a restart
        }
      }, 20000); // 20 second timeout for initial connection

      try {
        // *** Crucial check: Verify agent is running BEFORE connecting ***
        const agentStatus = await getAgentStatus(runId);
        if (!isMountedRef.current) return; // Check mount status after async call

        if (agentStatus.status !== 'running') {
          console.warn(
            `[useAgentStream] Agent run ${runId} is not in running state (status: ${agentStatus.status}). Cannot start stream.`,
          );
          setError(`Agent run is not running (status: ${agentStatus.status})`);
          finalizeStream(
            mapAgentStatus(agentStatus.status) || 'agent_not_running',
            runId,
          );
          return;
        }

        // Agent is running, proceed to create the stream
        console.log(
          `[useAgentStream] Agent run ${runId} confirmed running. Setting up EventSource.`,
        );
        const cleanup = streamAgent(runId, {
          onMessage: handleStreamMessage,
          onError: handleStreamError,
          onClose: handleStreamClose,
        });
        streamCleanupRef.current = cleanup;
        // Status will be updated to 'streaming' by the first message received in handleStreamMessage
        
        // Clear the initial connection timeout since we've connected successfully
        clearTimeout(initialConnectionTimeout);
      } catch (err) {
        if (!isMountedRef.current) return; // Check mount status after async call

        // Clear the initial connection timeout
        clearTimeout(initialConnectionTimeout);

        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Check for common "not running" messages that aren't actual errors
        const isNotRunningError = errorMessage.includes('not running') || 
                              errorMessage.includes('is already stopped') ||
                              errorMessage.includes('terminated');
        
        if (!isNotRunningError) {
          console.error(
            `[useAgentStream] Error initiating stream for ${runId}: ${errorMessage}`,
          );
        } else {
          console.log(
            `[useAgentStream] Agent run ${runId} not available for streaming: ${errorMessage}`,
          );
        }
        
        setError(errorMessage);

        const isNotFoundError =
          errorMessage.includes('not found') ||
          errorMessage.includes('404') ||
          errorMessage.includes('does not exist');

        // Special handling for the pathToRegexp 500 error or other server errors
        const isPathToRegexpError = errorMessage.includes('pathToRegexpError') || 
                                   (errorMessage.includes('500') && errorMessage.includes('Failed to initialize sandbox'));
        
        
        // Also restart for common transient errors
        const shouldRestart = !isNotFoundError && !isNotRunningError && (
          isPathToRegexpError || // Handle the specific pathToRegexp error
          errorMessage.includes('500') || // Any 500 error is worth retrying
          errorMessage.includes('time limit') ||
          errorMessage.includes('OTOL') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('network')
        );
        
        // If this is the pathToRegexp error, log it prominently
        if (isPathToRegexpError) {
          console.warn(`[useAgentStream] Detected pathToRegexp 500 error, will auto-retry: ${errorMessage}`);
          toast.warning("Server initialization error detected. Automatically retrying...");
        }

        finalizeStream(isNotFoundError ? 'agent_not_running' : 'error', runId, shouldRestart);
      }
    },
    [
      updateStatus,
      finalizeStream,
      handleStreamMessage,
      handleStreamError,
      handleStreamClose,
    ],
  ); // Add dependencies

  const stopStreaming = useCallback(async () => {
    if (!isMountedRef.current || !agentRunId) return;

    const runIdToStop = agentRunId;
    console.log(
      `[useAgentStream] Stopping stream for agent run ${runIdToStop}`,
    );

    // Immediately update status and clean up stream
    finalizeStream('stopped', runIdToStop);

    try {
      await stopAgent(runIdToStop);
      toast.success('Agent stopped.');
      // finalizeStream already called getAgentStatus implicitly if needed
    } catch (err) {
      // Don't revert status here, as the user intended to stop. Just log error.
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Check for common "not running" messages that aren't actual errors
      const isNotRunningError = errorMessage.includes('not running') || 
                            errorMessage.includes('is already stopped') ||
                            errorMessage.includes('terminated');
      
      if (!isNotRunningError) {
        console.error(
          `[useAgentStream] Error sending stop request for ${runIdToStop}: ${errorMessage}`,
        );
        toast.error(`Failed to stop agent: ${errorMessage}`);
      } else {
        console.log(
          `[useAgentStream] Agent already stopped or not running: ${errorMessage}`,
        );
        // Don't show error toast for this common case
        toast.info('Agent was already stopped');
      }
    }
  }, [agentRunId, finalizeStream]); // Add dependencies

  // Update the dependency arrays for functions with circular dependencies
  // @ts-ignore - This is a valid pattern in React for cyclical dependencies
  restartAgent.dependencies = [threadIdRef, isMountedRef, setStatus, setTextContent, setToolCall, setError, setAgentRunId, currentRunIdRef, startStreaming, updateStatus, updateActivityTimestamp];
  
  // @ts-ignore
  setupDeadAgentDetector.dependencies = [status, finalizeStream, setError, currentRunIdRef, isMountedRef, lastActivityTimestampRef];
  
  return {
    status,
    textContent,
    toolCall,
    error,
    agentRunId,
    startStreaming,
    stopStreaming,
  };
}
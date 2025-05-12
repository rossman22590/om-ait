"use client"

import { useEffect, useState, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock } from "lucide-react"
import { getAgentRuns, AgentRun } from "@/lib/api"
import { toast } from 'sonner'

interface ThreadTimerProps {
  threadId: string
}

// Define a custom keyframes animation CSS
const pulseAnimation = `
  @keyframes customPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .custom-pulse {
    animation: customPulse 2s ease-in-out infinite;
  }
`;

export function ThreadTimer({ threadId }: ThreadTimerProps) {
  const [minutesUsed, setMinutesUsed] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActivelyRunning, setIsActivelyRunning] = useState(false)
  
  // Ref to track the max minutes we've seen to prevent "going backwards"
  // Initialize from localStorage if available to persist across refreshes
  const maxMinutesSeenRef = useRef<number>(0) // Initialize with default value
  
  // Set the initial value from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`thread-timer-${threadId}`);
      if (stored) {
        const value = parseInt(stored, 10);
        maxMinutesSeenRef.current = value;
        // Initialize state with the stored value
        setMinutesUsed(value);
      }
    }
  }, [threadId])
  
  // Store the agent runs for continuous time calculation
  const agentRunsRef = useRef<AgentRun[]>([])
  
  // Store the last fetch time to avoid unnecessary API calls
  const lastFetchTimeRef = useRef<number>(0)
  
  // Track retry attempts for fetch failures
  const retryAttemptsRef = useRef<number>(0)
  
  // Calculate real-time minutes including active runs
  const calculateRealTimeMinutes = () => {
    if (!agentRunsRef.current || agentRunsRef.current.length === 0) return 0;
    
    let totalMinutes = 0;
    const currentTime = new Date().getTime();
    
    for (const run of agentRunsRef.current) {
      // For completed runs, use the exact time
      if (run.status === 'completed' && run.completed_at && run.started_at) {
        const startTime = new Date(run.started_at).getTime();
        const endTime = new Date(run.completed_at).getTime();
        
        if (startTime && endTime) {
          // Same formula as the backend: round up to nearest minute with minimum of 1
          const durationMs = endTime - startTime;
          const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
          totalMinutes += durationMinutes;
        }
      }
      // For active runs, calculate real-time from start until now
      else if (run.status === 'running' && run.started_at) {
        const startTime = new Date(run.started_at).getTime();
        
        if (startTime) {
          // Real-time calculation using current timestamp
          const durationMs = currentTime - startTime;
          const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
          totalMinutes += durationMinutes;
        }
      }
    }
    
    return totalMinutes;
  };
  
  // Save max minutes to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && minutesUsed !== null && minutesUsed > 0) {
      localStorage.setItem(`thread-timer-${threadId}`, maxMinutesSeenRef.current.toString());
    }
  }, [threadId, minutesUsed]);
  
  // Fetch time usage for this thread
  useEffect(() => {
    // This function fetches agent runs from the backend
    async function fetchAgentRuns() {
      if (!threadId) return
      
      try {
        const now = Date.now();
        // Force a fresh fetch on initial load or if it's been more than 10 seconds
        const shouldFetch = minutesUsed === null || now - lastFetchTimeRef.current > 10000;
        
        if (shouldFetch) {
          // Don't set loading to true if we already have a value
          // This prevents the "blinking" effect
          if (minutesUsed === null) {
            setLoading(true)
          }
          
          // Fetch with cache:no-store to ensure we get the latest data
          const freshAgentRuns = await getAgentRuns(threadId);
          
          // Check if we actually got data back
          if (!freshAgentRuns || freshAgentRuns.length === 0) {
            // If no agent runs but we have a stored value, use that
            if (maxMinutesSeenRef.current > 0) {
              console.log(`Thread ${threadId} has no agent runs, using stored value: ${maxMinutesSeenRef.current} min`);
              setMinutesUsed(maxMinutesSeenRef.current);
              setLoading(false);
              return;
            }
          }
          
          // Reset retry counter on successful fetch
          retryAttemptsRef.current = 0;
          
          // Store agent runs in ref for real-time calculations
          agentRunsRef.current = freshAgentRuns;
          lastFetchTimeRef.current = now;
          
          // Log for debugging
          console.log(`Thread ${threadId} fetched ${freshAgentRuns.length} agent runs`);
        }
        
        // Calculate and update minutes - this happens on every fetch
        const calculatedMinutes = calculateRealTimeMinutes();
        
        // Never go backwards - always use the maximum value we've seen
        const newMinutes = Math.max(calculatedMinutes, maxMinutesSeenRef.current);
        
        // Only update if the value has changed to avoid unnecessary rerenders
        if (newMinutes !== maxMinutesSeenRef.current) {
          maxMinutesSeenRef.current = newMinutes;
          // Save to localStorage immediately on significant changes
          if (typeof window !== 'undefined') {
            localStorage.setItem(`thread-timer-${threadId}`, newMinutes.toString());
          }
        }
        
        console.log(`Thread ${threadId} total minutes: ${newMinutes} (calculated: ${calculatedMinutes})`);
        setMinutesUsed(newMinutes);
      } catch (err) {
        console.error(`Failed to fetch agent runs for thread ${threadId}:`, err);
        
        // Implement exponential backoff for retries
        retryAttemptsRef.current += 1;
        const retryDelay = Math.min(2000 * Math.pow(2, retryAttemptsRef.current - 1), 30000); // Max 30s
        
        if (retryAttemptsRef.current <= 3) {
          console.log(`Retrying agent runs fetch in ${retryDelay/1000}s (attempt ${retryAttemptsRef.current})`);
          setTimeout(fetchAgentRuns, retryDelay);
        } else if (retryAttemptsRef.current === 4) {
          // Only show toast on final retry
          toast.error("Couldn't update timer data. Using cached value if available.");
        }
        
        // Don't break the UI on error - first try to use the cached value
        if (minutesUsed === null) {
          if (maxMinutesSeenRef.current > 0) {
            // Use cached value from ref/localStorage
            setMinutesUsed(maxMinutesSeenRef.current);
          } else {
            // Fallback to zero if no cached value
            setMinutesUsed(0);
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    // This function updates the timer display in real-time without fetching
    function updateTimerDisplay() {
      // Check if any agent is running
      const hasRunningAgent = agentRunsRef.current && agentRunsRef.current.some(run => run.status === 'running');
      
      // Update active state for UI effects
      setIsActivelyRunning(hasRunningAgent);
      
      // Only calculate if we have agent runs and at least one is running
      if (hasRunningAgent) {
        const updatedMinutes = calculateRealTimeMinutes();
        
        // Never go backwards - always use the maximum value we've seen
        const newMinutes = Math.max(updatedMinutes, maxMinutesSeenRef.current);
        maxMinutesSeenRef.current = newMinutes;
        
        setMinutesUsed(newMinutes);
      }
    }
    
    // Force initial fetch immediately on component mount
    fetchAgentRuns()
    
    // Listen for agent status events
    const handleAgentStatusChange = (event: CustomEvent<{status: string, threadId: string}>) => {
      if (event.detail.threadId === threadId) {
        console.log(`[ThreadTimer] Received agent status change: ${event.detail.status} for thread ${threadId}`);
        if (event.detail.status === 'stopped' || event.detail.status === 'completed' || event.detail.status === 'failed') {
          // Immediately force refresh when agent is done
          setIsActivelyRunning(false);
          fetchAgentRuns();
        } else if (event.detail.status === 'running') {
          setIsActivelyRunning(true);
        }
      }
    };
    
    // Add custom event listener for agent status changes
    window.addEventListener('agent-status-change', handleAgentStatusChange as EventListener);
    
    // Poll for updated data every 10 seconds
    const dataInterval = setInterval(fetchAgentRuns, 10000)
    
    // Update the display every second for real-time counting
    const displayInterval = setInterval(updateTimerDisplay, 1000)
    
    return () => {
      window.removeEventListener('agent-status-change', handleAgentStatusChange as EventListener);
      clearInterval(dataInterval);
      clearInterval(displayInterval);
    }
  }, [threadId])
  
  // Always render the component even while loading to reserve space in the layout
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={isActivelyRunning ? "flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md text-white cursor-help transition-all bg-pink-500 hover:bg-pink-600 animate-pulse" : "flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md text-white cursor-help transition-all bg-pink-500 hover:bg-pink-600"}>
            <Clock className="h-3 w-3" />
            <span>
              {loading && minutesUsed === null ? 
                "..." : 
                // Always show at least the stored max value, never show 0 if we have data
                `${minutesUsed || (maxMinutesSeenRef.current > 0 ? maxMinutesSeenRef.current : 0)} min`
              }
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total agent time used on this task</p>
          <p className="text-xs opacity-70">
            {isActivelyRunning 
              ? "⚡ Agent is running now - counting in real-time" 
              : "(Shows total time across all months)"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

"use client"

import { useEffect, useState, useRef } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock } from "lucide-react"
import { getThreadAgentRuns, AgentRun } from "@/lib/api"

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
  const maxMinutesSeenRef = useRef<number>(0)
  
  // Store the agent runs for continuous time calculation
  const agentRunsRef = useRef<AgentRun[]>([])
  
  // Store the last fetch time to avoid unnecessary API calls
  const lastFetchTimeRef = useRef<number>(0)
  
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
  
  // Fetch time usage for this thread
  useEffect(() => {
    // This function fetches agent runs from the backend
    async function fetchAgentRuns() {
      if (!threadId) return
      
      try {
        const now = Date.now();
        // Fetch new data only if it's been more than 10 seconds since last fetch
        // This reduces API load while still having fresh data
        if (now - lastFetchTimeRef.current > 10000) {
          // Don't set loading to true if we already have a value
          // This prevents the "blinking" effect
          if (minutesUsed === null) {
            setLoading(true)
          }
          
          // Fetch with cache:no-store to ensure we get the latest data
          const freshAgentRuns = await getThreadAgentRuns(threadId);
          
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
        maxMinutesSeenRef.current = newMinutes;
        
        console.log(`Thread ${threadId} total minutes: ${newMinutes} (calculated: ${calculatedMinutes})`);
        setMinutesUsed(newMinutes);
      } catch (err) {
        console.error("Failed to fetch agent runs:", err);
        // Don't break the UI on error - keep showing previous value if available
        if (minutesUsed === null) {
          setMinutesUsed(0);
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
    
    // Initial fetch of agent runs
    fetchAgentRuns()
    
    // Fetch fresh data every 10 seconds
    const dataInterval = setInterval(fetchAgentRuns, 10000)
    
    // Update the display every second for real-time counting
    const displayInterval = setInterval(updateTimerDisplay, 1000)
    
    return () => {
      clearInterval(dataInterval)
      clearInterval(displayInterval)
    }
  }, [threadId])
  
  // Always render the component even while loading to reserve space in the layout
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />
      <TooltipProvider>
        <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-md text-white cursor-help transition-all bg-pink-500 hover:bg-pink-600 ${isActivelyRunning ? 'custom-pulse' : ''}`}>
            <Clock className="h-3 w-3" />
            <span>{loading && minutesUsed === null ? "..." : `${minutesUsed || 0} min`}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total agent time used on this task</p>
          <p className="text-xs opacity-70">
            {isActivelyRunning 
              ? "⚡ Agent is running now - counting in real-time" 
              : "(Updates in real-time when agent is running)"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    </>
  )
}

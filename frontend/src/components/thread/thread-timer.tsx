"use client"

import { useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock } from "lucide-react"
import { getThreadAgentRuns, calculateThreadMinutes } from "@/lib/api"

interface ThreadTimerProps {
  threadId: string
}

export function ThreadTimer({ threadId }: ThreadTimerProps) {
  const [minutesUsed, setMinutesUsed] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Fetch time usage for this thread
  useEffect(() => {
    async function fetchTimeUsage() {
      if (!threadId) return
      
      try {
        // Don't set loading to true if we already have a value
        // This prevents the "blinking" effect
        if (minutesUsed === null) {
          setLoading(true)
        }
        
        // Use our API function to get agent runs
        const agentRuns = await getThreadAgentRuns(threadId);
        
        // Calculate minutes using the same formula as the billing system
        const totalMinutes = calculateThreadMinutes(agentRuns);
        
        // Log for debugging
        console.log(`Thread ${threadId} total minutes: ${totalMinutes}`);
        
        // Only update if changed or first load
        if (minutesUsed === null || totalMinutes !== minutesUsed) {
          setMinutesUsed(totalMinutes);
        }
      } catch (err) {
        console.error("Failed to calculate thread time:", err);
        // Don't break the UI on error - keep showing previous value if available
        if (minutesUsed === null) {
          setMinutesUsed(0);
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeUsage()
    
    // Refresh every 30 seconds to keep updated
    const interval = setInterval(fetchTimeUsage, 30000)
    return () => clearInterval(interval)
  }, [threadId, minutesUsed])
  
  // Always render the component even while loading to reserve space in the layout
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs bg-pink-500 px-2 py-0.5 rounded-md text-white hover:bg-pink-600 transition-colors">
            <Clock className="h-3 w-3" />
            <span>{loading && minutesUsed === null ? "..." : `${minutesUsed || 0} min`}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Total agent time used on this task</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

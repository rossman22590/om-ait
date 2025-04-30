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
        setLoading(true)
        
        // Use our API function to get agent runs
        const agentRuns = await getThreadAgentRuns(threadId);
        
        // Calculate minutes using the same formula as the billing system
        const totalMinutes = calculateThreadMinutes(agentRuns);
        setMinutesUsed(totalMinutes);
      } catch (err) {
        console.error("Failed to calculate thread time:", err);
        // Don't break the UI on error, just don't show the timer
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeUsage()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchTimeUsage, 60000)
    return () => clearInterval(interval)
  }, [threadId])
  
  // Always render the component even while loading to reserve space in the layout
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs bg-pink-500 px-2 py-0.5 rounded-md text-white hover:bg-pink-600 transition-colors">
            <Clock className="h-3 w-3" />
            <span>{loading ? "..." : `${minutesUsed} min`}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Agent time used this month</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

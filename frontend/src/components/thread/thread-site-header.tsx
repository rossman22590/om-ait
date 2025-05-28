'use client';

import { Button } from "@/components/ui/button"
import { FolderOpen, Link, PanelRightOpen, Check, X, Menu, Share2, Clock, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useRef, KeyboardEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { updateProject, getAgentRuns, AgentRun } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { ShareModal } from "@/components/sidebar/share-modal"
import { useModal } from "@/hooks/use-modal-store"

interface ThreadSiteHeaderProps {
  threadId: string;
  projectId: string;
  projectName: string;
  onViewFiles: () => void;
  onToggleSidePanel: () => void;
  onProjectRenamed?: (newName: string) => void;
  isMobileView?: boolean;
  debugMode?: boolean;
}

// ThreadTimer component for tracking agent usage
interface ThreadTimerProps {
  threadId: string
}

function ThreadTimer({ threadId }: ThreadTimerProps) {
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
          <div className={isActivelyRunning 
            ? "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white cursor-help bg-pink-500 hover:bg-pink-600 glow-effect" 
            : "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white cursor-help bg-pink-500 hover:bg-pink-600"}>

            <Clock className="h-3 w-3" />
            <span>
              {loading && minutesUsed === null ? 
                "..." : 
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

export function SiteHeader({
  threadId,
  projectId,
  projectName,
  onViewFiles,
  onToggleSidePanel,
  onProjectRenamed,
  isMobileView,
  debugMode,
}: ThreadSiteHeaderProps) {
  const pathname = usePathname()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  const isMobile = useIsMobile() || isMobileView
  const { setOpenMobile } = useSidebar()
  const router = useRouter();
  const { onOpen } = useModal();

  const openShareModal = () => {
    setShowShareModal(true)
  }

  const startEditing = () => {
    setEditName(projectName);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName(projectName);
  };

  const saveNewName = async () => {
    if (editName.trim() === '') {
      setEditName(projectName);
      setIsEditing(false);
      return;
    }

    if (editName !== projectName) {
      try {
        if (!projectId) {
          toast.error('Cannot rename: Project ID is missing');
          setEditName(projectName);
          setIsEditing(false);
          return;
        }

        const updatedProject = await updateProject(projectId, { name: editName })
        if (updatedProject) {
          onProjectRenamed?.(editName);
          toast.success('Project renamed successfully');
        } else {
          throw new Error('Failed to update project');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to rename project';
        console.error('Failed to rename project:', errorMessage);
        toast.error(errorMessage);
        setEditName(projectName);
      }
    }

    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveNewName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <>
      {/* Apply custom CSS animations for ThreadTimer */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes customPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .custom-pulse {
          animation: customPulse 2s ease-in-out infinite;
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px 2px rgba(236, 72, 153, 0.7); }
          50% { box-shadow: 0 0 10px 4px rgba(236, 72, 153, 0.9); }
        }
        
        .glow-effect {
          animation: glow 1.5s ease-in-out infinite;
        }
      ` }} />
      <header className={cn(
        "bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 z-20 w-full",
        isMobile && "px-2"
      )}>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenMobile(true)}
            className="h-9 w-9 mr-1"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}

        <div className="flex flex-1 items-center gap-2 px-3">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveNewName}
                className="h-8 w-auto min-w-[180px] text-base font-medium"
                maxLength={50}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={saveNewName}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={cancelEditing}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : !projectName || projectName === 'Project' ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <div
              className="text-base font-medium text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
              onClick={startEditing}
              title="Click to rename project"
            >
              {projectName}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 pr-4">
          {/* Thread Timer */}
          <ThreadTimer threadId={threadId} />
          
          {/* Debug mode indicator */}
          {debugMode && (
            <div className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-md mr-2">
              Debug
            </div>
          )}

          {isMobile ? (
            // Mobile view - only show the side panel toggle
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidePanel}
              className="h-9 w-9 cursor-pointer"
              aria-label="Toggle computer panel"
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          ) : (
            // Desktop view - show all buttons with tooltips
            <TooltipProvider>
              <Tooltip>
                {/* <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      // Show capabilities modal and then navigate to dashboard
                      onOpen("capabilitiesDialog");
                      // Navigate to dashboard
                      router.push("/dashboard");
                    }}
                    className="h-9 w-9 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger> */}
                <TooltipContent>
                  <p>New Chat</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onViewFiles}
                    className="h-9 w-9 cursor-pointer"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Files in Task</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openShareModal}
                    className="h-9 w-9 cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share Chat</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidePanel}
                    className="h-9 w-9 cursor-pointer"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Computer Preview (CMD+I)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </header>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadId={threadId}
        projectId={projectId}
      />
    </>
  )
} 
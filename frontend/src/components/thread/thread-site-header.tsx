'use client';

import { Button } from "@/components/ui/button"
import { FolderOpen, Link, PanelRightOpen, Check, X, Menu, Share2, Clock } from "lucide-react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useRef, KeyboardEvent, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { useUpdateProject } from "@/hooks/react-query/sidebar/use-project-mutations";
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import { ShareModal } from "@/components/sidebar/share-modal"
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "@/hooks/react-query/sidebar/keys";
import { threadKeys } from "@/hooks/react-query/threads/keys";
import { getAgentRuns, AgentRun } from "@/lib/api";

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

interface ThreadTimerProps {
  threadId: string
}

function ThreadTimer({ threadId }: ThreadTimerProps) {
  const [minutesUsed, setMinutesUsed] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActivelyRunning, setIsActivelyRunning] = useState(false)
  
  const maxMinutesSeenRef = useRef<number>(0)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`thread-timer-${threadId}`);
      if (stored) {
        const value = parseInt(stored, 10);
        if (!isNaN(value)) { 
          maxMinutesSeenRef.current = value;
          setMinutesUsed(value);
        }
      }
    }
  }, [threadId])
  
  const agentRunsRef = useRef<AgentRun[]>([])
  const lastFetchTimeRef = useRef<number>(0)
  const retryAttemptsRef = useRef<number>(0)
  
  const calculateRealTimeMinutes = () => {
    if (!agentRunsRef.current || agentRunsRef.current.length === 0) return 0;
    
    let totalMinutes = 0;
    const currentTime = new Date().getTime();
    
    for (const run of agentRunsRef.current) {
      if (run.status === 'completed' && run.completed_at && run.started_at) {
        const startTime = new Date(run.started_at).getTime();
        const endTime = new Date(run.completed_at).getTime();
        
        if (startTime && endTime) {
          const durationMs = endTime - startTime;
          const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
          totalMinutes += durationMinutes;
        }
      } else if (run.status === 'running' && run.started_at) {
        const startTime = new Date(run.started_at).getTime();
        
        if (startTime) {
          const durationMs = currentTime - startTime;
          const durationMinutes = Math.max(1, Math.ceil(durationMs / 60000));
          totalMinutes += durationMinutes;
        }
      }
    }
    return totalMinutes;
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined' && minutesUsed !== null && minutesUsed > 0) {
      localStorage.setItem(`thread-timer-${threadId}`, maxMinutesSeenRef.current.toString());
    }
  }, [threadId, minutesUsed]) 
  
  useEffect(() => {
    async function fetchAgentRuns() {
      if (!threadId) return
      
      try {
        const now = Date.now();
        const shouldFetch = minutesUsed === null || now - lastFetchTimeRef.current > 10000;
        
        if (shouldFetch) {
          if (minutesUsed === null) {
            setLoading(true)
          }
          
          const freshAgentRuns = await getAgentRuns(threadId);
          
          if (!freshAgentRuns || freshAgentRuns.length === 0) {
            if (maxMinutesSeenRef.current > 0) {
              console.log(`Thread ${threadId} has no agent runs, using stored value: ${maxMinutesSeenRef.current} min`);
              setMinutesUsed(maxMinutesSeenRef.current);
              setLoading(false);
              return;
            }
          }
          
          retryAttemptsRef.current = 0;
          agentRunsRef.current = freshAgentRuns || []; 
          lastFetchTimeRef.current = now;
          console.log(`Thread ${threadId} fetched ${(freshAgentRuns || []).length} agent runs`);
        }
        
        const calculatedMinutes = calculateRealTimeMinutes();
        const newMinutes = Math.max(calculatedMinutes, maxMinutesSeenRef.current);
        
        if (newMinutes !== maxMinutesSeenRef.current || minutesUsed !== newMinutes) { 
          maxMinutesSeenRef.current = newMinutes;
          if (typeof window !== 'undefined') {
            localStorage.setItem(`thread-timer-${threadId}`, newMinutes.toString());
          }
        }
        
        console.log(`Thread ${threadId} total minutes: ${newMinutes} (calculated: ${calculatedMinutes})`);
        setMinutesUsed(newMinutes);
      } catch (err) {
        console.error(`Failed to fetch agent runs for thread ${threadId}:`, err);
        retryAttemptsRef.current += 1;
        const retryDelay = Math.min(2000 * Math.pow(2, retryAttemptsRef.current - 1), 30000);
        
        if (retryAttemptsRef.current <= 3) {
          console.log(`Retrying agent runs fetch in ${retryDelay/1000}s (attempt ${retryAttemptsRef.current})`);
          setTimeout(fetchAgentRuns, retryDelay);
        } else if (retryAttemptsRef.current === 4) {
          toast.error("Couldn't update timer data. Using cached value if available.");
        }
        
        if (minutesUsed === null) {
          if (maxMinutesSeenRef.current > 0) {
            setMinutesUsed(maxMinutesSeenRef.current);
          } else {
            setMinutesUsed(0);
          }
        }
      } finally {
        setLoading(false)
      }
    }
    
    function updateTimerDisplay() {
      const hasRunningAgent = agentRunsRef.current && agentRunsRef.current.some(run => run.status === 'running');
      setIsActivelyRunning(hasRunningAgent);
      
      if (hasRunningAgent) {
        const updatedMinutes = calculateRealTimeMinutes();
        const newMinutes = Math.max(updatedMinutes, maxMinutesSeenRef.current);
        if (newMinutes > maxMinutesSeenRef.current) { 
             maxMinutesSeenRef.current = newMinutes;
        }
        setMinutesUsed(newMinutes);
      }
    }
    
    fetchAgentRuns()
    
    const handleAgentStatusChange = (event: CustomEvent<{status: string, threadId: string}>) => {
      if (event.detail.threadId === threadId) {
        console.log(`[ThreadTimer] Received agent status change: ${event.detail.status} for thread ${threadId}`);
        if (event.detail.status === 'stopped' || event.detail.status === 'completed' || event.detail.status === 'failed') {
          setIsActivelyRunning(false);
          fetchAgentRuns(); 
        } else if (event.detail.status === 'running') {
          setIsActivelyRunning(true);
          // Optionally, could call updateTimerDisplay here or rely on interval
        }
      }
    };
    
    window.addEventListener('agent-status-change', handleAgentStatusChange as EventListener);
    const dataInterval = setInterval(fetchAgentRuns, 10000) 
    const displayInterval = setInterval(updateTimerDisplay, 1000) 
    
    return () => {
      window.removeEventListener('agent-status-change', handleAgentStatusChange as EventListener);
      clearInterval(dataInterval);
      clearInterval(displayInterval);
    }
  }, [threadId]) 
  
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
  const [showShareModal, setShowShareModal] = useState(false);
  const queryClient = useQueryClient();

  const isMobile = useIsMobile() || isMobileView
  const { setOpenMobile } = useSidebar()
  const updateProjectMutation = useUpdateProject()

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

        const updatedProject = await updateProjectMutation.mutateAsync({
          projectId,
          data: { name: editName }
        })
        if (updatedProject) {
          onProjectRenamed?.(editName);
          queryClient.invalidateQueries({ queryKey: threadKeys.project(projectId) });
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
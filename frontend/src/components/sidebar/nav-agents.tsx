"use client"

import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Trash2,
  Plus,
  MessagesSquare,
  Loader2,
  Globe,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { getProjects, getThreads, deleteThread, toggleThreadPublicStatus, Project } from "@/lib/api"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Thread with associated project info for display in sidebar
type ThreadWithProject = {
  threadId: string;
  projectId: string;
  projectName: string;
  url: string;
  updatedAt: string;
  isPublic?: boolean;
}

export function NavAgents() {
  const { isMobile, state } = useSidebar()
  const [threads, setThreads] = useState<ThreadWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [threadToDelete, setThreadToDelete] = useState<ThreadWithProject | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Helper to sort threads by updated_at (most recent first)
  const sortThreads = (threadsList: ThreadWithProject[]): ThreadWithProject[] => {
    return [...threadsList].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  // Function to load threads data with associated projects
  const loadThreadsWithProjects = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      
      // Get all projects
      const projects = await getProjects() as Project[]
      console.log("Projects loaded:", projects.length, projects.map(p => ({ id: p.id, name: p.name })));
      
      // If no projects are found, the user might not be logged in
      if (projects.length === 0) {
        setThreads([])
        return
      }
      
      // Create a map of projects by ID for faster lookups
      const projectsById = new Map<string, Project>();
      projects.forEach(project => {
        projectsById.set(project.id, project);
      });
      
      // Get all threads at once
      const allThreads = await getThreads() 
      console.log("Threads loaded:", allThreads.length, allThreads.map(t => ({ thread_id: t.thread_id, project_id: t.project_id })));
      
      // Create display objects for threads with their project info
      const threadsWithProjects: ThreadWithProject[] = [];
      
      for (const thread of allThreads) {
        const projectId = thread.project_id;
        // Skip threads without a project ID
        if (!projectId) continue;
        
        // Get the associated project
        const project = projectsById.get(projectId);
        if (!project) {
          console.log(`❌ Thread ${thread.thread_id} has project_id=${projectId} but no matching project found`);
          continue;
        }
        
        console.log(`✅ Thread ${thread.thread_id} matched with project "${project.name}" (${projectId})`);
        
        // Add to our list
        threadsWithProjects.push({
          threadId: thread.thread_id,
          projectId: projectId,
          projectName: project.name || 'Unnamed Project',
          url: `/agents/${thread.thread_id}`,
          updatedAt: thread.updated_at || project.updated_at || new Date().toISOString(),
          isPublic: thread.is_public || false
        });
      }
      
      // Set threads, ensuring consistent sort order
      setThreads(sortThreads(threadsWithProjects))
    } catch (err) {
      console.error("Error loading threads with projects:", err)
      // Set empty threads array on error
      setThreads([])
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  // Load data on initial render
  useEffect(() => {
    loadThreadsWithProjects()
    
    // Set up an interval to refresh threads every 30 seconds
    const intervalId = setInterval(() => {
      loadThreadsWithProjects(false)
    }, 30000)
    
    // Listen for project updates
    window.addEventListener('project-updated', handleProjectUpdate)
    
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('project-updated', handleProjectUpdate)
    }
  }, [])
  
  // Listen for project update events
  const handleProjectUpdate = (event: Event) => {
    // Check if the event is a CustomEvent with detail
    if (event instanceof CustomEvent && event.detail) {
      console.log("Project update event received:", event.detail);
      
      // If this is a new project creation
      if (event.detail.action === 'created' && event.detail.projectId && event.detail.threadId) {
        // Reload threads to show the new one
        loadThreadsWithProjects();
      }
      
      // If this is a project rename
      if (event.detail.action === 'renamed' && event.detail.projectId && event.detail.newName) {
        // Update the local thread list with the new name
        setThreads(prev => {
          return prev.map(thread => {
            if (thread.projectId === event.detail.projectId) {
              return { ...thread, projectName: event.detail.newName };
            }
            return thread;
          });
        });
      }
    }
  };

  // Function to handle thread click with loading state
  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => {
    e.preventDefault()
    setLoadingThreadId(threadId)
    router.push(url)
  }

  // Handle thread deletion
  const handleDeleteThread = async () => {
    if (!threadToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Call the delete API
      await deleteThread(threadToDelete.threadId);
      
      // Close the dialog
      setDeleteDialogOpen(false);
      
      // Show success toast before reload
      toast.success("Thread deleted successfully");
      
      // Check if we're on the deleted thread's page
      const needsRedirect = pathname?.includes(threadToDelete.threadId);
      
      // Force a complete page refresh after a short delay
      setTimeout(() => {
        if (needsRedirect) {
          // Redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          // Just refresh the current page
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      console.error("Error deleting thread:", err);
      toast.error("Failed to delete thread");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  };
  
  // Function to open the delete confirmation dialog
  const confirmDelete = (thread: ThreadWithProject) => {
    setThreadToDelete(thread);
    setDeleteDialogOpen(true);
  };

  // Function to toggle thread public status
  const togglePublicStatus = async (thread: ThreadWithProject) => {
    try {
      // Toggle the current status
      const newStatus = !(thread.isPublic || false);
      
      // Update in the database
      await toggleThreadPublicStatus(thread.threadId, newStatus);
      
      // Show success message
      toast.success(`Thread is now ${newStatus ? 'public' : 'private'}`);
      
      // Update local state to reflect the change
      setThreads(prev => 
        prev.map(t => 
          t.threadId === thread.threadId 
            ? {...t, isPublic: newStatus} 
            : t
        )
      );
    } catch (err) {
      console.error("Error toggling public status:", err);
      toast.error("Failed to update public status");
    }
  };

  return (
    <>
      <SidebarGroup>
        <div className="flex justify-between items-center">
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          {state !== "collapsed" && (
            <Link 
              href="/dashboard" 
              className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center"
              aria-label="Create New Agent"
            >
              <Plus className="h-4 w-4" />
            </Link>
          )}
        </div>
        <SidebarMenu>
          {state === "collapsed" && (
            <SidebarMenuItem>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <Plus className="h-4 w-4" />
                      <span>New Agent</span>
                    </Link>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>Create New Agent</TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          )}
          {isLoading ? (
            // Loading state
            <>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={`skeleton-${i}`}>
                  <div className="flex items-center">
                    <div className="h-4 w-4 mr-2 rounded animate-pulse bg-accent"></div>
                    <div className="h-4 w-32 rounded animate-pulse bg-accent"></div>
                  </div>
                </SidebarMenuItem>
              ))}
            </>
          ) : threads.length > 0 ? (
            // Threads list
            <>
              {threads.map((thread) => {
                const isActive = pathname?.includes(thread.threadId) || false;
                const isThreadLoading = loadingThreadId === thread.threadId;
                
                return (
                  <SidebarMenuItem key={`thread-${thread.threadId}`}>
                    {state === "collapsed" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className={isActive ? "bg-accent text-accent-foreground" : ""}>
                            <Link href={thread.url} onClick={(e) => handleThreadClick(e, thread.threadId, thread.url)}>
                              {isThreadLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessagesSquare className="h-4 w-4" />
                              )}
                              <span>{thread.projectName}</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>{thread.projectName}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild className={isActive ? "bg-accent text-accent-foreground font-medium" : ""}>
                        <Link href={thread.url} onClick={(e) => handleThreadClick(e, thread.threadId, thread.url)}>
                          {isThreadLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessagesSquare className="h-4 w-4" />
                          )}
                          <span>{thread.projectName}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {state !== "collapsed" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-56 rounded-lg"
                          side={isMobile ? "bottom" : "right"}
                          align={isMobile ? "end" : "start"}
                        >
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + thread.url)
                            toast.success("Link copied to clipboard")
                          }}>
                            <LinkIcon className="text-muted-foreground" />
                            <span>Copy Link</span>
                          </DropdownMenuItem>
                          
                          {/* Share link option - only show if thread is public */}
                          {thread.isPublic && (
                            <DropdownMenuItem onClick={() => {
                              // Convert /agents/ to /share/ in the URL
                              const shareUrl = window.location.origin + thread.url.replace('/agents/', '/share/');
                              navigator.clipboard.writeText(shareUrl);
                              toast.success("Share link copied to clipboard");
                            }}>
                              <Globe className="text-muted-foreground" />
                              <span>Copy Share Link</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem asChild>
                            <a href={thread.url} target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="text-muted-foreground" />
                              <span>Open in New Tab</span>
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          
                          {/* Toggle public/private status */}
                          <DropdownMenuItem 
                            onClick={() => togglePublicStatus(thread)}
                          >
                            {thread.isPublic ? (
                              <>
                                <Lock className="text-muted-foreground" />
                                <span>Make Private</span>
                              </>
                            ) : (
                              <>
                                <Globe className="text-muted-foreground" />
                                <span>Make Public</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              confirmDelete(thread);
                            }}
                          >
                            <Trash2 className="text-destructive" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </>
          ) : (
            // Empty state
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MessagesSquare className="h-4 w-4" />
                <span>No agents yet</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              {threadToDelete && (
                <>
                  Are you sure you want to delete <strong>{threadToDelete.projectName}</strong>?
                  <br /><br />
                  This will permanently remove all messages and history for this thread. 
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteThread}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

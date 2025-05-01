"use client"

import { useEffect, useState, useMemo, useRef } from "react"
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
  Search,
  X,
  Pencil,
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
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { getProjects, getThreads, deleteThread, toggleThreadPublicStatus, updateProject, Project } from "@/lib/api"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
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

  // Filter threads based on search term
  const filteredThreads = useMemo(() => {
    if (!searchTerm) return threads;
    
    return threads.filter(thread => 
      thread.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [threads, searchTerm]);

  // Handle search input key events
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchTerm('')
    }
  }

  // Load data on initial render
  useEffect(() => {
    loadThreadsWithProjects()
  }, []);

  // Listen for user events that indicate thread data may have changed
  useEffect(() => {
    // Custom event fired when we need to reload threads
    const handleReloadThreads = () => {
      loadThreadsWithProjects(false);
    };
    
    window.addEventListener('reload-threads', handleReloadThreads);
    
    // Listen for project update events
    window.addEventListener('project-updated', handleProjectUpdate);
    
    return () => {
      window.removeEventListener('reload-threads', handleReloadThreads);
      window.removeEventListener('project-updated', handleProjectUpdate);
    };
  }, []);

  // Listen for project update events
  const handleProjectUpdate = (event: Event) => {
    // If the custom event has project data, process it
    const customEvent = event as CustomEvent<{project?: Project}>;
    const updatedProject = customEvent.detail?.project;
    
    if (updatedProject) {
      console.log("Project updated:", updatedProject.id, updatedProject.name);
      
      // Update the threads in state to reflect the project name change
      setThreads(currentThreads => 
        currentThreads.map(thread => {
          if (thread.projectId === updatedProject.id) {
            return {
              ...thread,
              projectName: updatedProject.name || 'Unnamed Project'
            };
          }
          return thread;
        })
      );
    } else {
      // If no specific project was provided, reload all threads
      loadThreadsWithProjects(false);
    }
  };

  // Function to handle thread click with loading state
  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => {
    // Don't navigate if we're editing
    if (editingThreadId === threadId) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault()
    setLoadingThreadId(threadId)
    router.push(url)
  }

  // Start editing project name
  const startRenaming = (thread: ThreadWithProject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setEditingThreadId(thread.threadId);
    setEditingName(thread.projectName);
    
    // Focus the input after it renders
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 10);
  }
  
  // Save the edited project name
  const saveProjectName = async () => {
    if (!editingThreadId || !editingName.trim()) {
      setEditingThreadId(null);
      return;
    }
    
    try {
      // Find the thread we're editing
      const thread = threads.find(t => t.threadId === editingThreadId);
      if (!thread) {
        throw new Error("Thread not found");
      }
      
      // Update project name in database
      await updateProject(thread.projectId, {
        name: editingName.trim()
      });
      
      // Update local state to show new name
      setThreads(currentThreads => 
        currentThreads.map(t => 
          t.projectId === thread.projectId 
            ? { ...t, projectName: editingName.trim() }
            : t
        )
      );
      
      toast.success("Chat renamed successfully");
      
      // Dispatch event to notify other components that project was updated
      window.dispatchEvent(new CustomEvent('project-updated', {
        detail: { 
          project: {
            id: thread.projectId,
            name: editingName.trim()
          }
        }
      }));
    } catch (error) {
      console.error("Error renaming chat:", error);
      toast.error("Failed to rename chat");
    } finally {
      setEditingThreadId(null);
    }
  }
  
  // Handle keyboard events for editing
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveProjectName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingThreadId(null);
    }
  }

  // Handle thread deletion
  const handleDeleteThread = async () => {
    if (!threadToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { threadId } = threadToDelete;
      const result = await deleteThread(threadId);
      
      if (result?.success) {
        toast.success('Thread deleted successfully');
        
        // Remove from UI
        setThreads(currentThreads => 
          currentThreads.filter(t => t.threadId !== threadId)
        );
        
        // If we're currently on that thread's page, redirect to dashboard
        if (pathname?.includes(threadId)) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread. Please try again.');
    } finally {
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
      const newStatus = !thread.isPublic;
      const result = await toggleThreadPublicStatus(thread.threadId, newStatus);
      
      if (result?.success) {
        toast.success(`Thread ${newStatus ? 'is now public' : 'is now private'}`);
        
        // Update in the UI
        setThreads(currentThreads => 
          currentThreads.map(t => {
            if (t.threadId === thread.threadId) {
              return {
                ...t,
                isPublic: newStatus
              };
            }
            return t;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling thread public status:', error);
      toast.error('Failed to update thread status. Please try again.');
    }
  };

  return (
    <>
      <SidebarGroup>
        {/* Search input - positioned above the header */}
        {state !== "collapsed" && (
          <div className="px-3 pt-2 pb-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <SidebarInput
                ref={searchInputRef}
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-8"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
        
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
          ) : filteredThreads.length > 0 ? (
            // Threads list
            <>
              {filteredThreads.map((thread) => {
                const isActive = pathname?.includes(thread.threadId) || false;
                const isThreadLoading = loadingThreadId === thread.threadId;
                
                return (
                  <SidebarMenuItem key={`thread-${thread.threadId}`}>
                    {editingThreadId === thread.threadId ? (
                      // Edit mode
                      <div className="flex items-center w-full px-3 py-1">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onBlur={saveProjectName}
                          className="w-full h-8 px-2 py-1 rounded text-sm bg-sidebar-foreground/10 text-sidebar-foreground border border-sidebar-foreground/20 focus:outline-none focus:ring-1 focus:ring-sidebar-foreground/30"
                          placeholder="Enter name..."
                        />
                      </div>
                    ) : state === "collapsed" ? (
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
                    {state !== "collapsed" && !editingThreadId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Thread actions</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {thread.isPublic && (
                            <DropdownMenuItem onClick={() => {
                              const shareUrl = `${window.location.origin}/share/${thread.threadId}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast.success("Share link copied to clipboard");
                            }}>
                              <Globe className="text-muted-foreground" />
                              <span>Copy Share Link</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={(e) => startRenaming(thread, e)}>
                            <Pencil className="text-muted-foreground" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          
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
          ) : threads.length > 0 && searchTerm ? (
            // No search results
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MessagesSquare className="h-4 w-4" />
                <span>No matches found</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
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

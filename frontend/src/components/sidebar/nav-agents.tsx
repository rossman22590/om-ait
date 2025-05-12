'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import {
  ArrowUpRight,
  Link as LinkIcon,
  MoreHorizontal,
  Trash2,
  Plus,
  MessagesSquare,
  Loader2,
  Share2,
  Pencil
} from "lucide-react"
import { toast } from "sonner"
import { usePathname, useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { getProjects, getThreads, Project, deleteThread, updateProject } from "@/lib/api"
import Link from "next/link"
import { ShareModal } from "./share-modal"
import { DeleteConfirmationDialog } from "@/components/thread/DeleteConfirmationDialog"
import { RenameDialog } from "./RenameDialog"
import { useDeleteOperation } from '@/contexts/DeleteOperationContext'
import { useSearch } from './search-context'

// Thread with associated project info for display in sidebar
type ThreadWithProject = {
  threadId: string;
  projectId: string;
  projectName: string;
  url: string;
  updatedAt: string;
};

interface NavAgentsProps {
  isCollapsed?: boolean;
}

export function NavAgents({ isCollapsed = false }: NavAgentsProps) {
  const { isMobile, state } = useSidebar()
  const [threads, setThreads] = useState<ThreadWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ threadId: string, projectId: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const isNavigatingRef = useRef(false)
  
  // Rename dialog state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [threadToRename, setThreadToRename] = useState<{ id: string; projectId: string; name: string } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const { performDelete, isOperationInProgress } = useDeleteOperation();
  const { searchQuery } = useSearch();
  const isPerformingActionRef = useRef(false);

  // Helper to sort threads by updated_at (most recent first)
  const sortThreads = (
    threadsList: ThreadWithProject[],
  ): ThreadWithProject[] => {
    return [...threadsList].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  // Function to load threads data with associated projects
  const loadThreadsWithProjects = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      // Get all projects
      const projects = await getProjects() as Project[]
      console.log("Projects loaded:", projects.length, projects.map(p => ({ id: p.id, name: p.name })));

      // If no projects are found, the user might not be logged in
      if (projects.length === 0) {
        setThreads([]);
        return;
      }

      // Create a map of projects by ID for faster lookups
      const projectsById = new Map<string, Project>();
      projects.forEach((project) => {
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
          console.log(
            `❌ Thread ${thread.thread_id} has project_id=${projectId} but no matching project found`,
          );
          continue;
        }

        console.log(`✅ Thread ${thread.thread_id} matched with project "${project.name}" (${projectId})`);

        // Add to our list
        threadsWithProjects.push({
          threadId: thread.thread_id,
          projectId: projectId,
          projectName: project.name || 'Unnamed Project',
          url: `/agents/${thread.thread_id}`,
          updatedAt:
            thread.updated_at || project.updated_at || new Date().toISOString(),
        });
      }

      // Set threads, ensuring consistent sort order
      setThreads(sortThreads(threadsWithProjects));
    } catch (err) {
      console.error('Error loading threads with projects:', err);
      // Set empty threads array on error
      setThreads([]);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Load threads dynamically from the API on initial load
  useEffect(() => {
    // Always start with loading state for consistency
    setIsLoading(true);
    loadThreadsWithProjects();
  }, []);

  // Listen for project-updated events to update the sidebar without full reload
  useEffect(() => {
    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { projectId, updatedData } = customEvent.detail;

        // Update just the name for the threads with the matching project ID
        setThreads(prevThreads => {
          const updatedThreads = prevThreads.map(thread =>
            thread.projectId === projectId
              ? {
                ...thread,
                projectName: updatedData.name,
              }
              : thread
          );

          // Return the threads without re-sorting immediately
          return updatedThreads;
        });

        // Silently refresh in background to fetch updated timestamp and re-sort
        setTimeout(() => loadThreadsWithProjects(false), 1000);
      }
    };

    // Add event listener
    window.addEventListener('project-updated', handleProjectUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener(
        'project-updated',
        handleProjectUpdate as EventListener,
      );
    };
  }, []);

  // Reset loading state when navigation completes (pathname changes)
  useEffect(() => {
    setLoadingThreadId(null);
  }, [pathname]);

  // Add event handler for completed navigation
  useEffect(() => {
    const handleNavigationComplete = () => {
      console.log('NAVIGATION - Navigation event completed');
      document.body.style.pointerEvents = 'auto';
      isNavigatingRef.current = false;
    };

    window.addEventListener("popstate", handleNavigationComplete);

    return () => {
      window.removeEventListener('popstate', handleNavigationComplete);
      // Ensure we clean up any leftover styles
      document.body.style.pointerEvents = "auto";
    };
  }, []);

  // Reset isNavigatingRef when pathname changes
  useEffect(() => {
    isNavigatingRef.current = false;
    document.body.style.pointerEvents = 'auto';
  }, [pathname]);

  // Function to handle thread click with loading state
  const handleThreadClick = (e: React.MouseEvent<HTMLAnchorElement>, threadId: string, url: string) => {
    e.preventDefault()
    setLoadingThreadId(threadId)
    router.push(url)
  }

  // Function to handle thread deletion
  const handleDeleteThread = async (threadId: string, threadName: string) => {
    setThreadToDelete({ id: threadId, name: threadName });
    setIsDeleteDialogOpen(true);
  };
  
  // Function to handle thread renaming
  const handleRenameThread = (threadId: string, projectId: string, threadName: string) => {
    setThreadToRename({ id: threadId, projectId, name: threadName });
    setIsRenameDialogOpen(true);
  };
  
  // Function to confirm renaming
  const confirmRename = async (newName: string) => {
    if (!threadToRename || isPerformingActionRef.current) return;
    
    try {
      // Mark action in progress
      isPerformingActionRef.current = true;
      setIsRenaming(true);
      
      // Close dialog first for immediate feedback
      setIsRenameDialogOpen(false);
      
      // Call the API to update the project name
      const updatedProject = await updateProject(threadToRename.projectId, { name: newName });
      
      // Update the thread list with the new name
      setThreads(prev => prev.map(thread => 
        thread.threadId === threadToRename.id 
          ? { ...thread, projectName: newName }
          : thread
      ));
      
      // Dispatch an event to notify other components
      window.dispatchEvent(
        new CustomEvent('project-updated', {
          detail: { 
            projectId: threadToRename.projectId,
            updatedData: updatedProject
          },
        }),
      );
      
      toast.success('Project renamed successfully');
    } catch (error) {
      console.error('Error renaming project:', error);
      toast.error('Failed to rename project');
    } finally {
      setIsRenaming(false);
      setThreadToRename(null);
      isPerformingActionRef.current = false;
    }
  };

  const confirmDelete = async () => {
    if (!threadToDelete || isPerformingActionRef.current) return;

    // Mark action in progress
    isPerformingActionRef.current = true;

    // Close dialog first for immediate feedback
    setIsDeleteDialogOpen(false);

    const threadId = threadToDelete.id;
    const isActive = pathname?.includes(threadId);

    // Store threadToDelete in a local variable since it might be cleared
    const deletedThread = { ...threadToDelete };

    // Log operation start
    console.log('DELETION - Starting thread deletion process', {
      threadId: deletedThread.id,
      isCurrentThread: isActive,
    });

    // Use the centralized deletion system with completion callback
    await performDelete(
      threadId,
      isActive,
      async () => {
        // Delete the thread
        await deleteThread(threadId);

        // Update the thread list
        setThreads(prev => prev.filter(t => t.threadId !== threadId));

        // Show success message
        toast.success('Conversation deleted successfully');
      },
      // Completion callback to reset local state
      () => {
        setThreadToDelete(null);
        setIsDeleting(false);
        isPerformingActionRef.current = false;
      },
    );
  };

  return (
    <SidebarGroup>
      <div className="flex justify-between items-center">
        <SidebarGroupLabel>Agents</SidebarGroupLabel>
        {state !== 'collapsed' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-md"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">New Agent</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>New Agent</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <SidebarMenu className="overflow-y-auto max-h-[calc(100vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {isCollapsed ? (
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <Plus className="h-4 w-4" />
                  </Link>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">New Agent</TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/dashboard" className="flex items-center">
                <Plus className="h-4 w-4" />
                <span>New Agent</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {isLoading ? (
          // Show skeleton loaders while loading
          Array.from({ length: 3 }).map((_, index) => (
            <SidebarMenuItem key={`skeleton-${index}`}>
              <SidebarMenuButton>
                <div className="h-4 w-4 bg-sidebar-foreground/10 rounded-md animate-pulse"></div>
                <div className="h-3 bg-sidebar-foreground/10 rounded w-3/4 animate-pulse"></div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))
        ) : !isLoading && threads.length > 0 ? (
          // Show all threads with project info
          <>
            {/* Filter threads based on search query */}
            {threads
              .filter(thread => !searchQuery || thread.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((thread, index) => {
              // Check if this thread is currently active
              const isActive = pathname?.includes(thread.threadId) || false;
              const isThreadLoading = loadingThreadId === thread.threadId;

              return (
                <SidebarMenuItem key={`thread-${thread.threadId}`}>
                  {state === 'collapsed' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          className={
                            isActive ? 'bg-accent text-accent-foreground' : ''
                          }
                        >
                          <Link
                            href={thread.url}
                            onClick={(e) =>
                              handleThreadClick(e, thread.threadId, thread.url)
                            }
                          >
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
                    <SidebarMenuButton
                      asChild
                      className={
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : ''
                      }
                    >
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={thread.url}
                              onClick={(e) =>
                                handleThreadClick(e, thread.threadId, thread.url)
                              }
                            >
                              {isThreadLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessagesSquare className="h-4 w-4" />
                              )}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {thread.projectName}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Link
                          href={thread.url}
                          onClick={(e) =>
                            handleThreadClick(e, thread.threadId, thread.url)
                          }
                        >
                          {isThreadLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessagesSquare className="h-4 w-4" />
                          )}
                          <span>{thread.projectName}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  )}
                  {state !== 'collapsed' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align={isMobile ? 'end' : 'start'}
                      >
                        <DropdownMenuItem onClick={() => {
                          setSelectedItem({ threadId: thread?.threadId, projectId: thread?.projectId })
                          setShowShareModal(true)
                        }}>
                          <Share2 className="text-muted-foreground" />
                          <span>Share Chat</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={thread.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ArrowUpRight className="text-muted-foreground" />
                            <span>Open in New Tab</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleRenameThread(
                              thread.threadId,
                              thread.projectId,
                              thread.projectName,
                            )
                          }
                        >
                          <Pencil className="text-muted-foreground" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteThread(
                              thread.threadId,
                              thread.projectName,
                            )
                          }
                        >
                          <Trash2 className="text-muted-foreground" />
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
          // Empty state or no search results
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MessagesSquare className="h-4 w-4" />
              <span>{searchQuery ? 'No matching agents found' : 'No agents yet'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        threadId={selectedItem?.threadId}
        projectId={selectedItem?.projectId}
      />

      {threadToDelete && (
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          threadName={threadToDelete.name}
          isDeleting={isDeleting}
        />
      )}
      
      {threadToRename && (
        <RenameDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onConfirm={confirmRename}
          currentName={threadToRename.name}
          isRenaming={isRenaming}
        />
      )}
    </SidebarGroup>
  );
}

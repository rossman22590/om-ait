'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  MoreHorizontal,
  Trash2,
  Loader2,
  Share2,
  X,
  Check,
  Search,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';

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
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { ShareModal } from './share-modal';
import { DeleteConfirmationDialog } from '@/components/thread/DeleteConfirmationDialog';
import { useDeleteOperation } from '@/contexts/DeleteOperationContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ThreadWithProject } from '@/hooks/react-query/sidebar/use-sidebar';
import {
  processThreadsWithProjects,
  useDeleteMultipleThreads,
  useDeleteThread,
  useProjects,
  useThreads,
} from '@/hooks/react-query/sidebar/use-sidebar';
import { projectKeys, threadKeys } from '@/hooks/react-query/sidebar/keys';
import { useUpdateProject } from '@/hooks/react-query/sidebar/use-project-mutations';

export function NavAgents() {
  const { isMobile, state } = useSidebar();
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    threadId: string;
    projectId: string;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const isNavigatingRef = useRef(false);
  const { performDelete } = useDeleteOperation();
  const isPerformingActionRef = useRef(false);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(
    new Set(),
  );
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [totalToDelete, setTotalToDelete] = useState(0);

  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [newThreadName, setNewThreadName] = useState('');
  const { mutate: updateProjectMutation } = useUpdateProject();

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useProjects();

  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    error: threadsError,
  } = useThreads();

  const { mutate: deleteThreadMutation, isPending: isDeletingSingle } =
    useDeleteThread();
  const {
    mutate: deleteMultipleThreadsMutation,
    isPending: isDeletingMultiple,
  } = useDeleteMultipleThreads();

  const combinedThreads: ThreadWithProject[] = useMemo(
    () =>
      !isProjectsLoading && !isThreadsLoading
        ? processThreadsWithProjects(threads, projects)
        : [],
    [threads, projects, isProjectsLoading, isThreadsLoading],
  );

  const filteredThreads = useMemo(() => {
    if (!searchQuery) {
      return combinedThreads;
    }
    return combinedThreads.filter((thread) =>
      thread.projectName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [combinedThreads, searchQuery]);

  const handleDeletionProgress = (completed: number, total: number) => {
    const percentage = (completed / total) * 100;
    setDeleteProgress(percentage);
  };

  useEffect(() => {
    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { projectId } = customEvent.detail;
        queryClient.invalidateQueries({
          queryKey: projectKeys.details(projectId),
        });
        queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      }
    };

    window.addEventListener(
      'project-updated',
      handleProjectUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        'project-updated',
        handleProjectUpdate as EventListener,
      );
    };
  }, [queryClient]);

  useEffect(() => {
    setLoadingThreadId(null);
  }, [pathname]);

  useEffect(() => {
    const handleNavigationComplete = () => {
      document.body.style.pointerEvents = 'auto';
      isNavigatingRef.current = false;
    };

    window.addEventListener('popstate', handleNavigationComplete);

    return () => {
      window.removeEventListener('popstate', handleNavigationComplete);
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  useEffect(() => {
    isNavigatingRef.current = false;
    document.body.style.pointerEvents = 'auto';
  }, [pathname]);

  const handleThreadClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    threadId: string,
    url: string,
  ) => {
    if (selectedThreads.has(threadId) || renamingThreadId === threadId) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    setLoadingThreadId(threadId);
    router.push(url);
  };

  const toggleThreadSelection = (threadId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setSelectedThreads((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(threadId)) {
        newSelection.delete(threadId);
      } else {
        newSelection.add(threadId);
      }
      return newSelection;
    });
  };

  const selectAllThreads = () => {
    const allThreadIds = filteredThreads.map((thread) => thread.threadId);
    setSelectedThreads(new Set(allThreadIds));
  };

  const deselectAllThreads = () => {
    setSelectedThreads(new Set());
  };

  const handleDeleteThread = async (threadId: string, threadName: string) => {
    setThreadToDelete({ id: threadId, name: threadName });
    setIsDeleteDialogOpen(true);
  };

  const handleMultiDelete = () => {
    if (selectedThreads.size === 0) return;

    const threadsToDelete = combinedThreads.filter((t) =>
      selectedThreads.has(t.threadId),
    );
    const threadNames = threadsToDelete.map((t) => t.projectName).join(', ');

    setThreadToDelete({
      id: 'multiple',
      name:
        selectedThreads.size > 3
          ? `${selectedThreads.size} conversations`
          : threadNames,
    });

    setTotalToDelete(selectedThreads.size);
    setDeleteProgress(0);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!threadToDelete || isPerformingActionRef.current) return;

    isPerformingActionRef.current = true;
    setIsDeleteDialogOpen(false);

    if (threadToDelete.id !== 'multiple') {
      const threadId = threadToDelete.id;
      const isActive = pathname?.includes(threadId);
      const deletedThread = { ...threadToDelete };
      const thread = combinedThreads.find((t) => t.threadId === threadId);
      const project = projects.find((p) => p.id === thread?.projectId);
      const sandboxId = project?.sandbox?.id;

      await performDelete(
        threadId,
        isActive,
        async () => {
          deleteThreadMutation(
            { threadId, sandboxId },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
                toast.success('Conversation deleted successfully');
              },
              onSettled: () => {
                setThreadToDelete(null);
                isPerformingActionRef.current = false;
              },
            },
          );
        },
        () => {
          setThreadToDelete(null);
          isPerformingActionRef.current = false;
        },
      );
    } else {
      const threadIdsToDelete = Array.from(selectedThreads);
      const isActiveThreadIncluded = threadIdsToDelete.some((id) =>
        pathname?.includes(id),
      );

      toast.info(`Deleting ${threadIdsToDelete.length} conversations...`);

      try {
        if (isActiveThreadIncluded) {
          isNavigatingRef.current = true;
          document.body.style.pointerEvents = 'none';
          router.push('/dashboard');
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        deleteMultipleThreadsMutation(
          {
            threadIds: threadIdsToDelete,
            threadSandboxMap: Object.fromEntries(
              threadIdsToDelete
                .map((threadId) => {
                  const thread = combinedThreads.find(
                    (t) => t.threadId === threadId,
                  );
                  const project = projects.find(
                    (p) => p.id === thread?.projectId,
                  );
                  return [threadId, project?.sandbox?.id || ''];
                })
                .filter(([, sandboxId]) => sandboxId),
            ),
            onProgress: handleDeletionProgress,
          },
          {
            onSuccess: (data) => {
              queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
              toast.success(
                `Successfully deleted ${data.successful.length} conversations`,
              );
              if (data.failed.length > 0) {
                toast.warning(
                  `Failed to delete ${data.failed.length} conversations`,
                );
              }
              setSelectedThreads(new Set());
              setDeleteProgress(0);
              setTotalToDelete(0);
            },
            onError: (error) => {
              console.error('Error in bulk deletion:', error);
              toast.error('Error deleting conversations');
            },
            onSettled: () => {
              setThreadToDelete(null);
              isPerformingActionRef.current = false;
              setDeleteProgress(0);
              setTotalToDelete(0);
            },
          },
        );
      } catch (err) {
        console.error('Error initiating bulk deletion:', err);
        toast.error('Error initiating deletion process');
        setSelectedThreads(new Set());
        setThreadToDelete(null);
        isPerformingActionRef.current = false;
        setDeleteProgress(0);
        setTotalToDelete(0);
      }
    }
  };

  const handleStartRename = (thread: ThreadWithProject) => {
    setRenamingThreadId(thread.threadId);
    setNewThreadName(thread.projectName);
  };

  const handleCancelRename = () => {
    setRenamingThreadId(null);
    setNewThreadName('');
  };

  const handleSaveRename = () => {
    if (!renamingThreadId || !newThreadName.trim()) {
      handleCancelRename();
      return;
    }

    const threadToRename = combinedThreads.find(
      (t) => t.threadId === renamingThreadId,
    );
    if (!threadToRename || threadToRename.projectName === newThreadName.trim()) {
      handleCancelRename();
      return;
    }

    updateProjectMutation(
      {
        projectId: threadToRename.projectId,
        data: { name: newThreadName.trim() },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
          queryClient.invalidateQueries({ queryKey: threadKeys.lists() });
          toast.success('Conversation renamed successfully');
          handleCancelRename();
        },
        onError: (error: any) => {
          toast.error(`Failed to rename: ${error.message}`);
          handleCancelRename();
        },
      },
    );
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  const isLoading = isProjectsLoading || isThreadsLoading;
  const hasError = projectsError || threadsError;

  if (hasError) {
    console.error('Error loading data:', { projectsError, threadsError });
  }

  return (
    <SidebarGroup>
      <div className="flex justify-between items-center">
        <SidebarGroupLabel>Tasks</SidebarGroupLabel>
        {state !== 'collapsed' ? (
          <div className="flex items-center space-x-1">
            {selectedThreads.size > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={deselectAllThreads}
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={selectAllThreads}
                  disabled={selectedThreads.size === filteredThreads.length}
                  className="h-7 w-7"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMultiDelete}
                  className="h-7 w-7 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {state !== 'collapsed' && (
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 w-full rounded-md"
          />
        </div>
      )}

      <SidebarMenu className="overflow-y-auto max-h-[calc(100vh-200px)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {state !== 'collapsed' && (
          <>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <SidebarMenuItem key={`skeleton-${index}`}>
                  <SidebarMenuButton>
                    <div className="h-4 w-4 bg-sidebar-foreground/10 rounded-md animate-pulse"></div>
                    <div className="h-3 bg-sidebar-foreground/10 rounded w-3/4 animate-pulse"></div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : filteredThreads.length > 0 ? (
              <>
                {filteredThreads.map((thread) => {
                  const isActive = pathname?.includes(thread.threadId) || false;
                  const isThreadLoading = loadingThreadId === thread.threadId;
                  const isSelected = selectedThreads.has(thread.threadId);

                  return (
                    <SidebarMenuItem
                      key={`thread-${thread.threadId}`}
                      className="group/row"
                    >
                      <SidebarMenuButton
                        asChild
                        className={`relative ${
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : isSelected
                              ? 'bg-primary/10'
                              : ''
                        }`}
                      >
                        <div className="flex items-center w-full">
                          {renamingThreadId === thread.threadId ? (
                            <div className="flex items-center flex-1 min-w-0 gap-1">
                              <Input
                                value={newThreadName}
                                onChange={(e) => setNewThreadName(e.target.value)}
                                onKeyDown={handleRenameKeyDown}
                                onBlur={handleSaveRename}
                                autoFocus
                                className="h-6 text-sm px-1 bg-transparent border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveRename();
                                }}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRename();
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Link
                                href={thread.url}
                                onClick={(e) =>
                                  handleThreadClick(
                                    e,
                                    thread.threadId,
                                    thread.url,
                                  )
                                }
                                className="flex items-center flex-1 min-w-0"
                              >
                                {isThreadLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                                ) : null}
                                <span className="truncate">
                                  {thread.projectName}
                                </span>
                              </Link>

                              <div
                                className="mr-1 flex-shrink-0 w-4 h-4 flex items-center justify-center group/checkbox"
                                onClick={(e) =>
                                  toggleThreadSelection(thread.threadId, e)
                                }
                              >
                                <div
                                  className={`h-4 w-4 border rounded cursor-pointer transition-all duration-150 flex items-center justify-center ${
                                    isSelected
                                      ? 'opacity-100 bg-primary border-primary hover:bg-primary/90'
                                      : 'opacity-0 group-hover/checkbox:opacity-100 border-muted-foreground/30 bg-background hover:bg-muted/50'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-muted/50 rounded transition-all duration-150 text-muted-foreground hover:text-foreground opacity-0 group-hover/row:opacity-100"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      document.body.style.pointerEvents =
                                        'auto';
                                    }}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">
                                      More actions
                                    </span>
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-56 rounded-lg"
                                  side={isMobile ? 'bottom' : 'right'}
                                  align={isMobile ? 'end' : 'start'}
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleStartRename(thread)}
                                  >
                                    <Edit2 className="text-muted-foreground" />
                                    <span>Rename</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedItem({
                                        threadId: thread?.threadId,
                                        projectId: thread?.projectId,
                                      });
                                      setShowShareModal(true);
                                    }}
                                  >
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
                            </>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </>
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton className="text-sidebar-foreground/70">
                  <span>
                    {searchQuery ? 'No results found' : 'No tasks yet'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </>
        )}
      </SidebarMenu>

      {(isDeletingSingle || isDeletingMultiple) && totalToDelete > 0 && (
        <div className="mt-2 px-2">
          <div className="text-xs text-muted-foreground mb-1">
            Deleting{' '}
            {deleteProgress > 0
              ? `(${Math.floor(deleteProgress)}%)`
              : '...'}
          </div>
          <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
            <div
              className="bg-primary h-1 transition-all duration-300 ease-in-out"
              style={{ width: `${deleteProgress}%` }}
            />
          </div>
        </div>
      )}

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
          isDeleting={isDeletingSingle || isDeletingMultiple}
        />
      )}
    </SidebarGroup>
  );
}

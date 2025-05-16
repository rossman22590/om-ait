'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Trash2, StopCircle } from 'lucide-react';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { SidebarSearch } from '@/components/sidebar/SidebarSearch';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { CTACard } from '@/components/sidebar/cta';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { isLocalMode } from '@/lib/config';
import { deleteAllThreads, stopAllAgents } from '@/lib/api';
import { toast } from 'sonner';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });
  
  // Function to handle deleting all agents (debug only)
  const handleDeleteAllAgents = async () => {
    if (!isLocalMode()) return;
    
    // Confirm with the user
    if (!window.confirm('⚠️ WARNING: This will delete ALL your agents and threads. This action cannot be undone. Continue?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteAllThreads();
      toast.success('All agents and threads deleted successfully');
      // Reload the page to refresh the UI
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete all agents:', error);
      toast.error(`Failed to delete all agents: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Function to handle stopping all running agents
  const handleStopAllAgents = async () => {
    try {
      setIsStopping(true);
      const result = await stopAllAgents();
      
      if (result.stopped > 0) {
        toast.success(`Stopped ${result.stopped} running agent${result.stopped === 1 ? '' : 's'}`);
      } else {
        toast.info('No running agents found to stop');
      }
    } catch (error) {
      console.error('Failed to stop all agents:', error);
      toast.error(`Failed to stop all agents: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsStopping(false);
    }
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setUser({
          name:
            data.user.user_metadata?.name ||
            data.user.email?.split('@')[0] ||
            'User',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
        });
      }
    };

    fetchUserData();
  }, []);

  // Handle keyboard shortcuts (CMD+B) for consistency
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        // We'll handle this in the parent page component
        // to ensure proper coordination between panels
        setOpen(!state.startsWith('expanded'));

        // Broadcast a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('sidebar-left-toggled', {
            detail: { expanded: !state.startsWith('expanded') },
          }),
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, setOpen]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-background/95 backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      {...props}
    >
      <SidebarHeader className="px-2 py-2">
        <div className="flex h-[40px] items-center px-1 relative">
          <Link href="/dashboard">
            <KortixLogo />
          </Link>
          {state !== 'collapsed' && (
            <div className="ml-2 transition-all duration-200 ease-in-out whitespace-nowrap">
              {/* <span className="font-semibold"> MACHINE </span> */}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            {/* Stop All Agents button - available in all environments */}
            {state !== 'collapsed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleStopAllAgents}
                    className="h-7 w-7 flex items-center justify-center rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 cursor-pointer"
                    disabled={isStopping}
                    aria-label="Stop All Running Agents"
                  >
                    {isStopping ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    ) : (
                      <StopCircle className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] p-3">
                  <p className="font-semibold text-orange-500 mb-1">Stop All Running Agents</p>
                  <p className="text-xs text-muted-foreground">Immediately stops all running agents across all threads. This will save credits but won't delete any data.</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Debug button - only shows in development mode */}
            {isLocalMode() && state !== 'collapsed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDeleteAllAgents}
                    className="h-7 w-7 flex items-center justify-center rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer"
                    disabled={isDeleting}
                    aria-label="Delete All Agents (Debug)"
                  >
                    {isDeleting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-red-500">DELETE ALL AGENTS (DEBUG)</p>
                </TooltipContent>
              </Tooltip>
            )}
            {state !== 'collapsed' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="h-8 w-8" />
                </TooltipTrigger>
                <TooltipContent>Toggle sidebar (CMD+B)</TooltipContent>
              </Tooltip>
            )}
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setOpenMobile(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Open menu</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {state !== 'collapsed' && <SidebarSearch />}
        <NavAgents />
      </SidebarContent>
      {state !== 'collapsed' && (
        <div className="px-3 py-2">
          <CTACard />
        </div>
      )}
      <SidebarFooter>
        {state === 'collapsed' && (
          <div className="mt-2 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="h-8 w-8" />
              </TooltipTrigger>
              <TooltipContent>Expand sidebar (CMD+B)</TooltipContent>
            </Tooltip>
          </div>
        )}
        <NavUserWithTeams user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

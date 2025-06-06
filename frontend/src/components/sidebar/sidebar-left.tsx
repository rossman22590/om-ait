'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Menu, Bot, Store, Search, X, StopCircle, Clock } from 'lucide-react';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { SidebarSearch } from "@/components/sidebar/sidebar-search";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { CTACard } from '@/components/sidebar/cta';
import { toast } from 'sonner';
import { stopAllAgents } from '@/lib/api';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [isStoppingAllAgents, setIsStoppingAllAgents] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>({
    name: 'Loading...',
    email: 'loading@example.com',
    avatar: '',
  });

  const pathname = usePathname();

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

  // Handler for stopping all agents
  const handleStopAllAgents = async () => {
    if (isStoppingAllAgents) return;
    
    try {
      setIsStoppingAllAgents(true);
      const result = await stopAllAgents();
      
      if (result.stopped > 0) {
        toast.success(`Stopped ${result.stopped} agent${result.stopped !== 1 ? 's' : ''}`);
      } else {
        toast.info('No running agents found');
      }
      
      if (result.errors > 0) {
        toast.error(`Failed to stop ${result.errors} agent${result.errors !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error('Failed to stop agents');
      console.error('Error stopping all agents:', error);
    } finally {
      setIsStoppingAllAgents(false);
    }
  };

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
              {/* <span className="font-semibold"> SUNA</span> */}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
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
        {/* Stop All Agents Button */}
        <div className="px-3 py-2">
          {state === 'collapsed' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleStopAllAgents}
                  className="h-8 w-8 mx-auto flex items-center justify-center rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                  disabled={isStoppingAllAgents}
                  aria-label="Stop All Running Agents"
                >
                  {isStoppingAllAgents ? (
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
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleStopAllAgents}
                  className="w-full h-8 flex items-center justify-center gap-2 rounded-md bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 cursor-pointer hover:scale-105 transition-transform active:scale-95"
                  disabled={isStoppingAllAgents}
                  aria-label="Stop All Running Agents"
                >
                  {isStoppingAllAgents ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      <span>Stopping All Agents...</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="h-4 w-4" />
                      <span>Stop All Agents</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] p-3">
                <p className="font-semibold text-orange-500 mb-1">Stop All Running Agents</p>
                <p className="text-xs text-muted-foreground">Immediately stops all running agents across all threads. This will save credits but won't delete any data.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {/* Search feature */}
        <SidebarSearch />
        <SidebarGroup>
        <Link href="/agents">
          <SidebarMenuButton className={cn({
            'bg-primary/10 font-medium': pathname === '/agents',
          })}>
            <Bot className="h-4 w-4 mr-2" />
            <span className="flex items-center justify-between w-full">
              Agent Playground
              <Badge variant="new">
                New
              </Badge>
            </span>
          </SidebarMenuButton>
        </Link>
        
        <Link href="/marketplace">
          <SidebarMenuButton className={cn({
            'bg-primary/10 font-medium': pathname === '/marketplace',
          })}>
            <Store className="h-4 w-4 mr-2" />
            <span className="flex items-center justify-between w-full">
              Marketplace
              <Badge variant="new">
                New
              </Badge>
            </span>
          </SidebarMenuButton>
        </Link>
          <Link href="/scheduled-tasks">
            <SidebarMenuButton className={cn({
              'bg-primary/10 font-medium': pathname === '/scheduled-tasks',
            })}>
              <Clock className="h-4 w-4 mr-2" /> {/* Changed icon */}
              <span className="flex items-center justify-between w-full">
                Scheduled Tasks
                <Badge variant="beta"> {/* Added New Badge */}
                  Beta
                </Badge>
              </span>
            </SidebarMenuButton>
          </Link>
      </SidebarGroup>
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

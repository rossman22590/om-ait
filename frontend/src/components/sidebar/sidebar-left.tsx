'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Menu, Store, Plus, Zap, Plug, ChevronRight, Loader2, Puzzle, CodeSquare } from 'lucide-react';

import { NavAgents } from '@/components/sidebar/nav-agents';
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams';
import { KortixLogo } from '@/components/sidebar/kortix-logo';
import { CTACard } from '@/components/sidebar/cta';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NewAgentDialog } from '@/components/agents/new-agent-dialog';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFeatureFlags } from '@/lib/feature-flags';
import posthog from '@/lib/posthog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state, setOpen, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
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
  const searchParams = useSearchParams();
  const { flags, loading: flagsLoading } = useFeatureFlags(['custom_agents', 'agent_marketplace']);
  const customAgentsEnabled = flags.custom_agents;
  const marketplaceEnabled = flags.agent_marketplace;
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);
  // Check if user has access to Fragments (high-tier plans only)
  // Temporarily set to true until we implement proper subscription checks
  const hasFragmentsAccess = true;

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
        event.preventDefault();
        setOpen(!state.startsWith('expanded'));
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
        <div className="px-2 mb-4">
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleStopAllAgents}
                disabled={isStoppingAll}
                variant="outline"
                size={state === 'collapsed' ? 'icon' : 'sm'}
                className={`${state === 'collapsed' ? 'w-8 h-8' : 'w-full'} bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300`}
              >
                {isStoppingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {state !== 'collapsed' && <span className="ml-2">Stopping...</span>}
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4" />
                    {state !== 'collapsed' && <span className="ml-2">Stop All Agents</span>}
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Stop all currently running agents for your account</p>
            </TooltipContent>
          </Tooltip> */}
        </div>
        <SidebarGroup>
          <Link href="/dashboard">
            <SidebarMenuButton className={cn({
              'bg-accent text-accent-foreground font-medium': pathname === '/dashboard',
            }, 'cursor-pointer')} onClick={() => posthog.capture('new_task_clicked')}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="flex items-center justify-between w-full">
                New Task
              </span>
            </SidebarMenuButton>
          </Link>
          {!flagsLoading && customAgentsEnabled && (
            <SidebarMenu>
              <Collapsible
                defaultOpen={pathname?.includes('/agents')}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Agents"
                      className="cursor-pointer"
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      <span>Agents</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton className={cn('pl-3', {
                          'bg-accent text-accent-foreground font-medium': pathname === '/agents' && searchParams.get('tab') === 'marketplace',
                        })} asChild>
                          <Link href="/agents?tab=marketplace">
                            <span>Explore</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton className={cn('pl-3', {
                          'bg-accent text-accent-foreground font-medium': pathname === '/agents' && (searchParams.get('tab') === 'my-agents' || searchParams.get('tab') === null),
                        })} asChild>
                          <Link href="/agents?tab=my-agents">
                            <span>My Agents</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton 
                          onClick={() => setShowNewAgentDialog(true)}
                          className="cursor-pointer pl-3"
                        >
                          <span>New Agent</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          )}
          {!flagsLoading && customAgentsEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings/credentials">
                  <SidebarMenuButton className={cn({
                    'bg-accent text-accent-foreground font-medium': pathname === '/settings/credentials',
                  }, 'cursor-pointer')}>
                    <Plug className="h-4 w-4 mr-1" />
                    <span className="flex items-center justify-between w-full">
                      Integrations
                    </span>
                  </SidebarMenuButton>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Manage API keys & integrations</TooltipContent>
            </Tooltip>
          )}
          {!flagsLoading && customAgentsEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SidebarMenuButton 
                    className={cn({
                      'opacity-50 cursor-not-allowed': !hasFragmentsAccess,
                      'cursor-pointer hover:bg-accent': hasFragmentsAccess,
                      'bg-accent text-accent-foreground font-medium': pathname?.includes('/fragments'),
                    })}
                    onClick={() => {
                      if (hasFragmentsAccess) {
                        window.open('https://machine-fragments.up.railway.app/', '_blank');
                      }
                    }}
                  >
                    <Puzzle className="h-4 w-4 mr-1" />
                    <span className="flex items-center justify-between w-full">
                      Fragments
                      {!hasFragmentsAccess && (
                        <Badge variant="secondary" className="ml-2 text-xs bg-pink-500 text-white border-pink-500">
                          Pro+
                        </Badge>
                      )}
                    </span>
                  </SidebarMenuButton>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {hasFragmentsAccess 
                  ? 'Access Machine Fragments - Advanced workflow automation' 
                  : 'Upgrade to Ultra, Enterprise, Scale, or Premium plan to access Fragments'
                }
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/machine-code">
                <SidebarMenuButton className={cn({
                  'bg-accent text-accent-foreground font-medium': pathname === '/machine-code',
                }, 'cursor-pointer')}>
                  <CodeSquare className="h-4 w-4 mr-1" />
                  <span className="flex items-center justify-between w-full">
                    Machine Code
                  </span>
                </SidebarMenuButton>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Full IDE-like code editor for building and editing Machine projects</TooltipContent>
          </Tooltip>
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
      <NewAgentDialog 
        open={showNewAgentDialog} 
        onOpenChange={setShowNewAgentDialog}
      />
    </Sidebar>
  );
}

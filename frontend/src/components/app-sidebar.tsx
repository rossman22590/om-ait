"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  GalleryVerticalEnd,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { TeamSwitcher } from "@/components/team-switcher"
import { NavUserWithTeams } from '@/components/sidebar/nav-user-with-teams'
import { DocsThemeToggle } from "@/components/ui/docs-theme-toggle"
import { Badge } from "@/components/ui/badge"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "./home/theme-toggle"
import Image from "next/image"
import { useEffect } from "react"
import { useTheme } from "next-themes"

const data = {
  user: {
    name: "Machine User",
    email: "docs@machine.ai",
    avatar: "/favicon.png",
  },
  teams: [
    {
      name: "Machine AI",
      logo: GalleryVerticalEnd,
      plan: "AI Platform",
    },
  ],
  navMain: [
    {
      title: "Getting Started",
      items: [
        {
          title: "What is Machine?",
          url: "/docs/introduction",
        },
        {
          title: "Compare with Others",
          url: "/docs/comparison-chart",
        },
        {
          title: "Getting Started",
          url: "/docs/getting-started",
        },
      ],
    },
    {
      title: "User Guides",
      items: [
        {
          title: "User Guide",
          url: "/docs/user-guide",
        },
        {
          title: "Dashboard Guide",
          url: "/docs/dashboard",
        },
        {
          title: "Workspace & Organization",
          url: "/docs/workspace",
        },
        {
          title: "Knowledge Base",
          url: "/docs/knowledge-base",
        },
        {
          title: "Agent Management",
          url: "/docs/agent-management",
        },
        {
          title: "Use Cases",
          url: "/docs/use-cases",
        },
      ],
    },
    {
      title: "Building Agents",
      items: [
        {
          title: "Building Agents",
          url: "/docs/building-agents",
        },
        {
          title: "AI Models",
          url: "/docs/models",
        },
        {
          title: "Features & Tools",
          url: "/docs/features",
        },
        {
          title: "Integrations & MCPs",
          url: "/docs/integrations",
        },
        {
          title: "Example Agents",
          url: "/docs/example-agents",
        },
      ],
    },
    {
      title: "Why Machine?",
      items: [
        {
          title: "Why Machine?",
          url: "/docs/why-machine",
        },
      ],
    },
    {
      title: "Advanced",
      items: [
        {
          title: "Advanced Topics",
          url: "/docs/advanced",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { toggleSidebar, state } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = !mounted
    ? '/logo.png'
    : resolvedTheme === 'dark'
      ? '/logo.png'
      : '/logo.png';
  

  const isActive = (url: string) => {
    return pathname === url
  }

  return (
    <Sidebar className="w-72 [&_[data-sidebar=sidebar]]:bg-white dark:[&_[data-sidebar=sidebar]]:bg-black border-none" {...props}>
      <SidebarHeader className="bg-transparent p-6 px-2">
        <Image
          src={logoSrc}
          alt="Machine Logo"
          width={35}
          height={35}
          className="w-[35px] h-[35px]"
          priority
        /> 
      </SidebarHeader>
      <SidebarContent className="px-2 bg-transparent scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="font-medium tracking-wide">{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={`font-semibold ${(item as any).comingSoon ? 'opacity-70 cursor-not-allowed' : ''}`}
                      asChild={!((item as any).comingSoon)}
                      isActive={isActive(item.url)}
                    >
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-transparent p-4 flex flex-row justify-between items-center gap-2 group-data-[state=expanded]:flex group-data-[state=collapsed]:hidden">
        <div className="text-muted-foreground text-xs">Version 10.6.0</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
            title={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {state === 'expanded' ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <ThemeToggle/>
        </div>
      </SidebarFooter>
      <div className="group-data-[state=collapsed]:flex group-data-[state=expanded]:hidden p-2 flex justify-center">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <SidebarRail />
    </Sidebar>
  )
}
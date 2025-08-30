"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  GalleryVerticalEnd,
} from "lucide-react"

import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"
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
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false);
  const { theme, resolvedTheme } = useTheme();

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
          width={40}
          height={30}
          className="w-[40px] h-[30px]"
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
                      className="font-semibold"
                      asChild
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
      <SidebarFooter className="bg-transparent p-4 flex flex-row justify-between items-center">
        <div className="text-muted-foreground text-xs">Version 10.2.0</div>
        <ThemeToggle/>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


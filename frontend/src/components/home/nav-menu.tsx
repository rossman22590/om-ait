"use client";

import { siteConfig } from "@/lib/home";
import { motion } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  name: string;
  href: string;
}

const navs: NavItem[] = siteConfig.nav.links;

export function NavMenu() {
  const ref = useRef<HTMLUListElement>(null);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  // Determine active path for highlighting
  const getActiveItem = () => {
    // Direct path match for pages
    if (pathname === "/") return navs[0]; // Home
    
    // For other pages
    return navs.find(item => pathname === item.href) || navs[0];
  };

  useEffect(() => {
    // Update pill position whenever path changes
    const activeItem = getActiveItem();
    const activeElement = ref.current?.querySelector(
      `[data-href="${activeItem.href}"]`
    )?.parentElement;
    
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect();
      setLeft(activeElement.offsetLeft);
      setWidth(rect.width);
      setIsReady(true);
    }
  }, [pathname]);

  return (
    <div className="w-full hidden md:block">
      <ul
        className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center"
        ref={ref}
      >
        {navs.map((item) => {
          const isActive = item.href === pathname || 
                         (pathname === "/" && item.href === "/");
          
          return (
            <li
              key={item.name}
              className={`z-10 cursor-pointer h-full flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-primary/60 hover:text-primary"
              } tracking-tight`}
            >
              <Link href={item.href} data-href={item.href}>
                {item.name}
              </Link>
            </li>
          );
        })}
        {isReady && (
          <motion.li
            animate={{ left, width }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-0 my-1.5 rounded-full bg-accent/60 border border-border"
          />
        )}
      </ul>
    </div>
  );
}
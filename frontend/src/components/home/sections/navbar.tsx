"use client";

import { Icons } from "@/components/home/icons";
import { NavMenu } from "@/components/home/nav-menu";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { siteConfig } from "@/lib/home";
import { cn } from "@/lib/utils";
import { Menu, X, Github } from "lucide-react";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/AuthProvider";
import { ChevronRight } from "lucide-react";

const INITIAL_WIDTH = "70rem";
const MAX_WIDTH = "800px";

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: 100,
    transition: { duration: 0.1 },
  },
};

const drawerMenuContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const drawerMenuVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function Navbar() {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = siteConfig.nav.links.map((item) =>
        item.href.substring(1),
      );

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setHasScrolled(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = () => setIsDrawerOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full flex justify-center transition-all duration-300 px-4",
        hasScrolled ? "py-2" : "py-4",
      )}
    >
      <div
        className={cn(
          "w-full rounded-full transition-all duration-300 border",
          hasScrolled
            ? "max-w-[900px] bg-white/90 dark:bg-gray-900/90 shadow-md"
            : "max-w-[1100px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        )}
      >
        <div className="flex h-[56px] items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-6">
            <Image 
              src="https://pixiomedia.nyc3.digitaloceanspaces.com/uploads/1745430984238-gxDs711.png" 
              alt="AI Tutor Machine" 
              width={100} 
              height={30} 
              className="w-auto h-8" 
            />
          </Link>

          <NavMenu />

          <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              {user ? (
                <Link
                  className="bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 h-8 hidden md:flex items-center justify-center text-sm font-medium tracking-wide rounded-full text-white dark:text-white w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-transparent dark:border-white/20"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  className="bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 h-8 hidden md:flex items-center justify-center text-sm font-medium tracking-wide rounded-full text-white dark:text-white w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-transparent dark:border-white/20"
                  href="/auth"
                >
                  Sign In
                </Link>
              )}
            </div>
            <ThemeToggle />
            <button
              className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
              onClick={toggleDrawer}
            >
              {isDrawerOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            key="drawer"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={toggleDrawer}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 top-20 z-50 overflow-hidden rounded-t-2xl border border-border bg-card p-4"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="mb-6">
                <h2 className="font-display text-xl font-semibold text-card-foreground">
                  Menu
                </h2>
                <p className="text-muted-foreground">
                  Navigate to any section.
                </p>
              </div>
              <motion.div className="flex flex-col gap-2 divide-y divide-border">
                {siteConfig.nav.links.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      // Only prevent default for hash links to handle in-page navigation
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        toggleDrawer();
                        // Smooth scroll to the section
                        const targetId = item.href.substring(1);
                        const element = document.getElementById(targetId);
                        if (element) {
                          const elementPosition = element.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.pageYOffset - 100;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth',
                          });
                        }
                      } else {
                        // For regular links, let the browser handle navigation naturally
                        // Just close the drawer first
                        toggleDrawer();
                      }
                    }}
                    className="flex items-center justify-between py-2 text-lg font-medium text-card-foreground hover:text-primary"
                  >
                    {item.name}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
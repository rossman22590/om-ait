'use client';

import { siteConfig } from '@/lib/home';
import { motion } from 'motion/react';
import React, { useRef, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
}

// Use the site config but adjust links based on current page
const getNavItems = (pathname: string) => {
  // If we're not on the home page, we need to adjust links with anchor references
  return siteConfig.nav.links.map(link => {
    // If we're not on the home page
    if (pathname !== '/') {
      if (link.name === 'Home') {
        // Home link should go to root
        return { ...link, href: '/' };
      } else if (link.href.startsWith('#')) {
        // Links to sections on home page should go to home page + that section
        return { ...link, href: `/${link.href}` };
      }
    }
    return link;
  });
};

export function NavMenu() {
  const pathname = usePathname();
  const ref = useRef<HTMLUListElement>(null);
  const [left, setLeft] = useState(0);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isManualScroll, setIsManualScroll] = useState(false);
  const [navs, setNavs] = useState<NavItem[]>([]);

  React.useEffect(() => {
    // Set nav items based on current path
    setNavs(getNavItems(pathname));
  }, [pathname]);

  React.useEffect(() => {
    // Only proceed if we have nav items
    if (navs.length === 0) return;
    
    // Initialize with first nav item
    const firstItem = ref.current?.querySelector(
      `[href^="${navs[0].href}"]`,
    )?.parentElement;
    if (firstItem) {
      const rect = firstItem.getBoundingClientRect();
      setLeft(firstItem.offsetLeft);
      setWidth(rect.width);
      setIsReady(true);
    }
  }, [navs]);

  React.useEffect(() => {
    // Only apply scroll handling on the home page
    if (pathname !== '/') return;
    
    const handleScroll = () => {
      // Skip scroll handling during manual click scrolling
      if (isManualScroll) return;

      // Only process links that start with #
      const sections = navs
        .filter(item => item.href.startsWith('#'))
        .map((item) => item.href.substring(1));

      // Find the section closest to viewport top
      let closestSection = sections[0];
      let minDistance = Infinity;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - 100); // Offset by 100px to trigger earlier
          if (distance < minDistance) {
            minDistance = distance;
            closestSection = section;
          }
        }
      }

      // Update active section and nav indicator
      setActiveSection(closestSection);
      const navItem = ref.current?.querySelector(
        `[href="#${closestSection}"]`,
      )?.parentElement;
      if (navItem) {
        const rect = navItem.getBoundingClientRect();
        setLeft(navItem.offsetLeft);
        setWidth(rect.width);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isManualScroll, navs, pathname]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) => {
    // Handle different types of links
    if (pathname === '/') {
      // On home page, handle anchor links
      if (item.href.startsWith('#')) {
        e.preventDefault();
        const targetId = item.href.substring(1);
        const element = document.getElementById(targetId);

        if (element) {
          // Set manual scroll flag
          setIsManualScroll(true);

          // Immediately update nav state
          setActiveSection(targetId);
          const navItem = e.currentTarget.parentElement;
          if (navItem) {
            const rect = navItem.getBoundingClientRect();
            setLeft(navItem.offsetLeft);
            setWidth(rect.width);
          }

          // Calculate exact scroll position
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset

          // Smooth scroll to exact position
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });

          // Reset manual scroll flag after animation completes
          setTimeout(() => {
            setIsManualScroll(false);
          }, 500); // Adjust timing to match scroll animation duration
        }
      }
    } else {
      // On other pages, handle links that contain anchors (like /#use-cases)
      if (item.href.includes('#') && item.href.startsWith('/')) {
        // Let the default navigation happen - Next.js will handle this correctly
        // No need to preventDefault
      }
    }
    // For all other links, allow default navigation behavior
    // This ensures links to /about, /pricing, etc. work correctly
  };

  return (
    <div className="w-full hidden md:block">
      <ul
        className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center"
        ref={ref}
      >
        {navs.map((item) => (
          <li
            key={item.name}
            className={`z-10 cursor-pointer h-full flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              // Only check activeSection for anchor links on home page
              (pathname === '/' && item.href.startsWith('#') && activeSection === item.href.substring(1))
                ? 'text-primary'
                : (pathname !== '/' && item.name === 'Home')
                  ? 'text-primary/60 hover:text-primary' // Home link on other pages
                  : (pathname === item.href || (pathname.startsWith(item.href) && !item.href.startsWith('#')))
                    ? 'text-primary' // Current page
                    : 'text-primary/60 hover:text-primary'
            } tracking-tight`}
          >
            <a href={item.href} onClick={(e) => handleClick(e, item)}>
              {item.name}
            </a>
          </li>
        ))}
        {isReady && (
          <motion.li
            animate={{ left, width }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute inset-0 my-1.5 rounded-full bg-accent/60 border border-border"
          />
        )}
      </ul>
    </div>
  );
}

// 'use client';

// import { siteConfig } from '@/lib/home';
// import { motion } from 'motion/react';
// import React, { useRef, useState } from 'react';

// interface NavItem {
//   name: string;
//   href: string;
// }

// const navs: NavItem[] = siteConfig.nav.links;

// export function NavMenu() {
//   const ref = useRef<HTMLUListElement>(null);
//   const [left, setLeft] = useState(0);
//   const [width, setWidth] = useState(0);
//   const [isReady, setIsReady] = useState(false);
//   const [activeSection, setActiveSection] = useState('hero');
//   const [isManualScroll, setIsManualScroll] = useState(false);

//   React.useEffect(() => {
//     // Initialize with first nav item
//     const firstItem = ref.current?.querySelector(
//       `[href="#${navs[0].href.substring(1)}"]`,
//     )?.parentElement;
//     if (firstItem) {
//       const rect = firstItem.getBoundingClientRect();
//       setLeft(firstItem.offsetLeft);
//       setWidth(rect.width);
//       setIsReady(true);
//     }
//   }, []);

//   React.useEffect(() => {
//     const handleScroll = () => {
//       // Skip scroll handling during manual click scrolling
//       if (isManualScroll) return;

//       const sections = navs.map((item) => item.href.substring(1));

//       // Find the section closest to viewport top
//       let closestSection = sections[0];
//       let minDistance = Infinity;

//       for (const section of sections) {
//         const element = document.getElementById(section);
//         if (element) {
//           const rect = element.getBoundingClientRect();
//           const distance = Math.abs(rect.top - 100); // Offset by 100px to trigger earlier
//           if (distance < minDistance) {
//             minDistance = distance;
//             closestSection = section;
//           }
//         }
//       }

//       // Update active section and nav indicator
//       setActiveSection(closestSection);
//       const navItem = ref.current?.querySelector(
//         `[href="#${closestSection}"]`,
//       )?.parentElement;
//       if (navItem) {
//         const rect = navItem.getBoundingClientRect();
//         setLeft(navItem.offsetLeft);
//         setWidth(rect.width);
//       }
//     };

//     window.addEventListener('scroll', handleScroll);
//     handleScroll(); // Initial check
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, [isManualScroll]);

//   const handleClick = (
//     e: React.MouseEvent<HTMLAnchorElement>,
//     item: NavItem,
//   ) => {
//     e.preventDefault();

//     const targetId = item.href.substring(1);
//     const element = document.getElementById(targetId);

//     if (element) {
//       // Set manual scroll flag
//       setIsManualScroll(true);

//       // Immediately update nav state
//       setActiveSection(targetId);
//       const navItem = e.currentTarget.parentElement;
//       if (navItem) {
//         const rect = navItem.getBoundingClientRect();
//         setLeft(navItem.offsetLeft);
//         setWidth(rect.width);
//       }

//       // Calculate exact scroll position
//       const elementPosition = element.getBoundingClientRect().top;
//       const offsetPosition = elementPosition + window.pageYOffset - 100; // 100px offset

//       // Smooth scroll to exact position
//       window.scrollTo({
//         top: offsetPosition,
//         behavior: 'smooth',
//       });

//       // Reset manual scroll flag after animation completes
//       setTimeout(() => {
//         setIsManualScroll(false);
//       }, 500); // Adjust timing to match scroll animation duration
//     }
//   };

//   return (
//     <div className="w-full hidden md:block">
//       <ul
//         className="relative mx-auto flex w-fit rounded-full h-11 px-2 items-center justify-center"
//         ref={ref}
//       >
//         {navs.map((item) => (
//           <li
//             key={item.name}
//             className={`z-10 cursor-pointer h-full flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
//               activeSection === item.href.substring(1)
//                 ? 'text-primary'
//                 : 'text-primary/60 hover:text-primary'
//             } tracking-tight`}
//           >
//             <a href={item.href} onClick={(e) => handleClick(e, item)}>
//               {item.name}
//             </a>
//           </li>
//         ))}
//         {isReady && (
//           <motion.li
//             animate={{ left, width }}
//             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
//             className="absolute inset-0 my-1.5 rounded-full bg-accent/60 border border-border"
//           />
//         )}
//       </ul>
//     </div>
//   );
// }

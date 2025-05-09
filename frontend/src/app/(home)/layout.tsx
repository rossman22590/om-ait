'use client';

import { Navbar } from "@/components/home/sections/navbar";
import { useEffect } from "react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Redirect to the specified URL
    window.location.href = "https://beta.machine.myapps.ai/";
  }, []);

  // The original layout is still returned, but the redirect will happen
  // before the user sees much of it
  return (
    <div className="w-full relative" data-homepage="true">
      <div className="block w-px h-full border-l border-border fixed top-0 left-6 z-10"></div>
      <div className="block w-px h-full border-r border-border fixed top-0 right-6 z-10"></div>
      <Navbar />
      {children}
    </div>
  );
}

// import { Navbar } from "@/components/home/sections/navbar";

// export default function HomeLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <div className="w-full relative" data-homepage="true">
//       <div className="block w-px h-full border-l border-border fixed top-0 left-6 z-10"></div>
//       <div className="block w-px h-full border-r border-border fixed top-0 right-6 z-10"></div>
//       <Navbar />
//       {children}
//     </div>
//   );
// }

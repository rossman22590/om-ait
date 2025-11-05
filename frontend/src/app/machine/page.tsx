import Image from 'next/image';
import Link from 'next/link';

export default function MachinePage() {
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Logo, headline, features, CTA, and footer remain unchanged */}
      <div className="flex flex-col items-center justify-center gap-8 max-w-2xl w-full py-20 z-10 relative">
        {/* Logo with animated shadow */}
        <div className="mb-6 relative">
          <span className="absolute inset-0 flex items-center justify-center animate-pulse pointer-events-none">
            <span className="w-28 h-28 rounded-full bg-muted/30 blur-2xl" />
          </span>
          <Image
            src="/logo.png"
            alt="Machine Logo"
            width={112}
            height={112}
            priority
            className="rounded-2xl shadow-xl relative z-10"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-center tracking-tight text-balance drop-shadow-lg">
          Machine
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-center text-muted-foreground mb-2">
          Autonomous AI Worker for Modern Automation
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground text-center max-w-xl mb-4">
          Machine is an advanced autonomous AI agent designed to automate research,
          data analysis, browser tasks, file management, and more. Built for
          reliability, privacy, and extensibility.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl pt-2">
          <div className="rounded-xl bg-white/10 dark:bg-black/10 border border-border p-5 shadow-sm flex flex-col items-center">
            <span className="text-2xl">🌐</span>
            <span className="font-semibold mt-2">Browser Automation</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">
              Navigate, extract, and automate web workflows.
            </span>
          </div>
          <div className="rounded-xl bg-white/10 dark:bg-black/10 border border-border p-5 shadow-sm flex flex-col items-center">
            <span className="text-2xl">📁</span>
            <span className="font-semibold mt-2">File Management</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">
              Create, edit, and organize documents and files.
            </span>
          </div>
          <div className="rounded-xl bg-white/10 dark:bg-black/10 border border-border p-5 shadow-sm flex flex-col items-center">
            <span className="text-2xl">📊</span>
            <span className="font-semibold mt-2">Data Analysis</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">
              Process, analyze, and visualize data sets.
            </span>
          </div>
          <div className="rounded-xl bg-white/10 dark:bg-black/10 border border-border p-5 shadow-sm flex flex-col items-center">
            <span className="text-2xl">⚙️</span>
            <span className="font-semibold mt-2">System Operations</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">
              Automate DevOps, system tasks, and workflows.
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-10">
          <Link href="/dashboard" className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:bg-primary/90 transition text-center">
            Get Started
          </Link>
          <Link href="/docs" className="px-8 py-4 rounded-full border border-border bg-background font-bold text-lg shadow hover:bg-accent/50 transition text-muted-foreground text-center">
            Learn More
          </Link>
        </div>
      </div>
      <footer className="w-full text-center py-8 text-xs text-muted-foreground/60 border-t border-border/30 z-10 relative">
        &copy; {new Date().getFullYear()} Machine. All rights reserved.
      </footer>
    </main>
  );
}

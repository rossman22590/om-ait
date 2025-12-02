"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDirectoryQuery } from '@/hooks/files/use-file-queries';
import { FolderOpen, FilePlus2, Sparkles, Clipboard, FileText, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
// no sample file creation

interface WorkspaceIntroModalProps {
  sandboxId?: string | null;
}

function hasAnyFiles(files: Array<{ is_dir: boolean }>): boolean {
  return files?.some((f) => !f.is_dir) ?? false;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}`;
}

export function WorkspaceIntroModal({ sandboxId }: WorkspaceIntroModalProps) {
  const { data: files, isLoading } = useDirectoryQuery(sandboxId || undefined, '/workspace', { enabled: !!sandboxId });
  const [open, setOpen] = React.useState(false);
  const [dontShowAgain, setDontShowAgain] = React.useState(true);
  const closeReasonRef = React.useRef<'outside' | 'escape' | 'button' | null>(null);
  const starterPrompt = React.useMemo(() => (
    "Create /workspace/hello.txt with the text: 'Welcome to my workspace!'. Then tell me how to view it."
  ), []);

  const workflowPrompts = React.useMemo(() => ([
    {
      title: 'Market research',
      text: "Research 'AI in retail': collect 5 credible sources; save a brief at /workspace/research/retail-ai.md and a 6-slide outline at /workspace/presentations/retail-ai-outline.md."
    },
    {
      title: 'Data ETL + chart',
      text: 'Download https://example.com/sales.csv, clean data, compute MoM growth by region; save cleaned CSV to /workspace/data/sales_clean.csv and bar chart to /workspace/charts/growth_by_region.png; summarize to /workspace/reports/sales_insights.md.'
    },
    {
      title: 'Summarize a PDF',
      text: 'From /workspace/input/handbook.pdf, summarize each section with page refs to /workspace/summaries/handbook_summary.md and key actions to /workspace/summaries/actions.md.'
    },
    {
      title: 'Code scaffold',
      text: 'Create a minimal Next.js page “Status Dashboard” with a table, under /workspace/app/status/page.tsx and styles at /workspace/styles/status.css; docs in /workspace/README.md.'
    }
  ]), []);

  React.useEffect(() => {
    const seen = getCookie('workspace_intro_shown') === '1';
    const empty = !sandboxId || (files ? !hasAnyFiles(files) : false);
    if (!seen && empty && (!sandboxId || !isLoading)) setOpen(true);
  }, [files, sandboxId, isLoading]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Cookie is only set by explicit "Got it" action
    if (!next) {
      // reset reason after close
      closeReasonRef.current = null;
    }
  };

  // removed sample file creation

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideCloseButton
        onInteractOutside={() => { closeReasonRef.current = 'outside'; }}
        onEscapeKeyDown={() => { closeReasonRef.current = 'escape'; }}
        className="max-w-xl max-h-[85vh] p-0 overflow-hidden flex flex-col"
      >
        <div className="bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-pink-500/15 px-5 py-3 border-b border-border flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              Get your workspace started
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-100/40 dark:bg-amber-900/10 p-3">
            <Info className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Tip: Press <span className="font-medium">Got it</span> to stop seeing this message in the future. Clicking outside will close it only for this visit.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground font-medium">
                {!sandboxId ? 'Sandbox will be created on first action' : (isLoading ? 'Checking files…' : (files && files.length > 0 ? `${files.filter(f=>!f.is_dir).length} files • ${files.filter(f=>f.is_dir).length} folders` : 'No files found'))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="dontshow" checked={dontShowAgain} onCheckedChange={(v)=>setDontShowAgain(!!v)} />
              <label htmlFor="dontshow" className="text-muted-foreground select-none cursor-pointer">Don’t show again</label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your project workspace is empty. Features like file previews, downloads, and many tools unlock after you add at least one file under <span className="font-medium text-foreground">/workspace</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <FilePlus2 className="w-4 h-4" />
                Ask the agent
              </div>
              <p className="text-xs text-muted-foreground">Have the agent create a starter file for you.</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={async ()=>{ await navigator.clipboard.writeText(starterPrompt); toast.success('Prompt copied'); }}>Copy prompt</Button>
              </div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <FolderOpen className="w-4 h-4" />
                Upload a file
              </div>
              <p className="text-xs text-muted-foreground">Use the chat’s attachment button to upload into /workspace.</p>
              <p className="text-[11px] text-muted-foreground mt-1">Common: .txt, .md, .csv, .pdf, images</p>
            </div>
            <div className="rounded-xl border border-border p-3 bg-card/50">
              <div className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <Sparkles className="w-4 h-4" />
                Use a tool
              </div>
              <p className="text-xs text-muted-foreground">Many tools save outputs into /workspace automatically.</p>
              <Link href="/tools" className="text-xs text-primary mt-1 inline-flex items-center gap-1">Learn more</Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-muted-foreground flex-1">
                <div className="text-foreground font-medium mb-1">Quick starter prompt</div>
                <div className="select-text break-words">{starterPrompt}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 rounded-lg"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(starterPrompt);
                    toast.success('Copied to clipboard');
                  } catch {
                    toast.error('Copy failed');
                  }
                }}
              >
                <Clipboard className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Workflow examples
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {workflowPrompts.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 bg-card/40">
                  <div className="text-xs font-medium mb-1">{p.title}</div>
                  <div className="text-xs text-muted-foreground mb-2 break-words">{p.text}</div>
                  <Button size="sm" variant="outline" className="h-7 rounded-lg"
                    onClick={async()=>{ try { await navigator.clipboard.writeText(p.text); toast.success('Prompt copied'); } catch {} }}
                  >Copy</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border flex-shrink-0 bg-background">
          <Button
            className="rounded-lg bg-pink-500 hover:bg-pink-500/90 text-white"
            onClick={() => {
              closeReasonRef.current = 'button';
              if (dontShowAgain) setCookie('workspace_intro_shown', '1', 60 * 60 * 24 * 30);
              setOpen(false);
            }}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WorkspaceIntroModal;

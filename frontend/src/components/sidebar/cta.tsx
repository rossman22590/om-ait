import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Briefcase, ExternalLink } from 'lucide-react';
import { KortixProcessModal } from '@/components/sidebar/kortix-enterprise-modal';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function CTACard() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <div className={`rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/40 shadow-sm border border-blue-200/50 dark:border-blue-800/50 ${isCollapsed ? 'p-2' : 'p-4'} transition-all`}>
      <div className={`flex flex-col ${isCollapsed ? 'space-y-2' : 'space-y-4'}`}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-foreground">Enterprise</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>AI employees for your company</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Enterprise Demo
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              AI employees for your company
            </span>
          </div>
        )}

        <div>
          <KortixProcessModal />
        </div>

        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="https://www.kortix.ai/careers"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <Briefcase className="h-3.5 w-3.5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Join Our Team! 🚀</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center pt-1 border-t border-blue-200/50 dark:border-blue-800/30 mt-1">
            <Link
              href="https://www.kortix.ai/careers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Briefcase className="mr-1.5 h-3.5 w-3.5" />
              Join Our Team! 🚀
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

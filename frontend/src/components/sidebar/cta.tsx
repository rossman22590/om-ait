import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export function CTACard() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-pink-50 to-pink-200 dark:from-pink-950/40 dark:to-pink-900/40 shadow-sm border border-pink-200/50 dark:border-pink-800/50 p-4 transition-all">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground flex items-center">
            <Zap className="h-4 w-4 mr-1.5 text-pink-500" />
            Upgrade to Pro
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            Get access to premium models
          </span>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/40 border-pink-200 dark:border-pink-800/50 text-sm"
            asChild
          >
            <Link href="/settings/billing">
              View Plans
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

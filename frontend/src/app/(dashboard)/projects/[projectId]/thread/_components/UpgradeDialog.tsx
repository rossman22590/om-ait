import React from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Clock, Crown, Sparkles, Zap } from 'lucide-react';
import { UpgradeDialog as UnifiedUpgradeDialog } from '@/components/ui/upgrade-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
}

export function UpgradeDialog({ open, onOpenChange, onDismiss }: UpgradeDialogProps) {
  const router = useRouter();

  const handleUpgradeClick = () => {
    router.push('/settings/billing');
    onOpenChange(false);
    localStorage.setItem('suna_upgrade_dialog_displayed', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-primary" />
            Unlock the Full Machine Experience
          </DialogTitle>
          <DialogDescription>
            You're currently using Machine's free tier with limited capabilities.
            Upgrade now to access our most powerful AI model.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Pro Benefits</h3>

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="rounded-full bg-secondary/10 p-2 flex-shrink-0 mt-0.5">
                <Brain className="h-4 w-4 text-secondary" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Advanced AI Models</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get access to advanced models suited for complex tasks</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="rounded-full bg-secondary/10 p-2 flex-shrink-0 mt-0.5">
                <Zap className="h-4 w-4 text-secondary" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Faster Responses</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get access to faster models that breeze through your tasks</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="rounded-full bg-secondary/10 p-2 flex-shrink-0 mt-0.5">
                <Clock className="h-4 w-4 text-secondary" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Higher Usage Limits</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enjoy more conversations and longer run durations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onDismiss}
            className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
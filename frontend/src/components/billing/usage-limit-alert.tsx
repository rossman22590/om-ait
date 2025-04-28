import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import { PlanComparison } from "./plan-comparison";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { isLocalMode } from "@/lib/config";

interface BillingErrorAlertProps {
  message?: string;
  currentUsage?: number;
  limit?: number;
  accountId: string | null | undefined;
  onDismiss?: () => void;
  className?: string;
  isOpen: boolean;
}

export function BillingErrorAlert({
  message,
  currentUsage,
  limit,
  accountId,
  onDismiss,
  className = "",
  isOpen
}: BillingErrorAlertProps) {
  const returnUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Skip rendering in local development mode
  if (isLocalMode() || !isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto py-4"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onDismiss}
                aria-hidden="true"
              />
              
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "relative bg-background rounded-lg shadow-xl w-full max-w-3xl mx-3",
                  className
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby="billing-modal-title"
              >
                <div className="p-5">
                  {/* Close button */}
                  {onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Close dialog"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}

                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center justify-center p-2 bg-destructive/10 rounded-full mb-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <h2 id="billing-modal-title" className="text-xl font-medium tracking-tight mb-2">
                      Usage Limit Reached
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {message || "You've reached your monthly usage limit. Please upgrade your plan."}
                    </p>
                  </div>

                  {/* Usage Stats */}
                  {currentUsage !== undefined && limit !== undefined && (
                    <div className="mb-5 p-4 bg-muted/30 border border-border rounded-lg max-w-sm mx-auto">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Usage</p>
                          <p className="text-base font-semibold">{(currentUsage * 60).toFixed(0)}m</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-muted-foreground">Limit</p>
                          <p className="text-base font-semibold">{(limit * 60).toFixed(0)}m</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          className="h-full bg-destructive rounded-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Plans Comparison */}
                  <div className="mb-4 w-full border-t border-border pt-4">
                    <PlanComparison
                      accountId={accountId}
                      returnUrl={returnUrl}
                      className="mb-3 w-full"
                      isCompact={false}
                    />
                  </div>

                  {/* Dismiss Button */}
                  {onDismiss && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground text-sm"
                        onClick={onDismiss}
                      >
                        Continue with Current Plan
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
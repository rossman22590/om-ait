'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface StripeCheckoutButtonProps {
  accountId: string;
  planId: string;
  returnUrl: string;
  className?: string;
  isCurrentPlan?: boolean;
  buttonText: string;
  buttonColor: string;
  isCompact?: boolean;
}

export function StripeCheckoutButton({
  accountId,
  planId,
  returnUrl,
  className,
  isCurrentPlan = false,
  buttonText,
  buttonColor,
  isCompact = false
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (isCurrentPlan) return;
    
    setIsLoading(true);
    setError(null);
    setDialogOpen(true);
    
    try {
      // Create form data manually
      const formData = new FormData();
      formData.append('accountId', accountId);
      formData.append('returnUrl', returnUrl);
      formData.append('planId', planId);
      
      console.log('Starting checkout with:', { accountId, planId, returnUrl });
      
      // Make a direct fetch request to the API endpoint
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      if (url) {
        console.log('Got Stripe checkout URL:', url);
        // Store URL and show in dialog instead of immediate redirect
        setCheckoutUrl(url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Unexpected error during checkout:', err);
      setError(err.message || 'An unexpected error occurred');
      setDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToCheckout = () => {
    if (checkoutUrl) {
      console.log('User confirmed, redirecting to:', checkoutUrl);
      window.location.href = checkoutUrl;
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCheckoutUrl(null);
    setError(null);
  };

  return (
    <>
      <Button
        onClick={handleCheckout}
        disabled={isLoading || isCurrentPlan}
        className={cn(
          "w-full font-medium transition-colors",
          isCompact 
            ? "h-7 rounded-md text-xs" 
            : "h-10 rounded-full text-sm",
          isCurrentPlan 
            ? "bg-muted text-muted-foreground hover:bg-muted" 
            : buttonColor,
          className
        )}
      >
        {isLoading ? "Processing..." : isCurrentPlan ? "Current Plan" : buttonText}
      </Button>
      
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Confirm Subscription Upgrade</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={handleCloseDialog}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              You're about to upgrade to the {planId.charAt(0).toUpperCase() + planId.slice(1)} plan.
            </DialogDescription>
          </DialogHeader>
          
          {error ? (
            <div className="text-center p-4">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={handleCloseDialog}>
                Close
              </Button>
            </div>
          ) : !checkoutUrl ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DialogFooter className="flex sm:justify-between">
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleContinueToCheckout}
                className={buttonColor}
              >
                Continue to Checkout
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

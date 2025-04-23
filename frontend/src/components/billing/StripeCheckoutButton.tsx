'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const handleCheckout = async () => {
    if (isCurrentPlan) return;
    
    setIsLoading(true);
    setError(null);
    
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
        console.log('Redirecting to Stripe checkout:', url);
        // Direct browser redirect
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Unexpected error during checkout:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
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
    </div>
  );
}

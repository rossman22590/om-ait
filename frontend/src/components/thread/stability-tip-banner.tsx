'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StabilityTipBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Check if the user has previously dismissed this banner
  useEffect(() => {
    const hasDismissed = localStorage.getItem('stability-tip-dismissed') === 'true';
    if (hasDismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    // Store the user's preference
    localStorage.setItem('stability-tip-dismissed', 'true');
    // Animate out
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "relative w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/30",
        "border-b border-amber-200 dark:border-amber-800/50",
        "transition-all duration-300 ease-in-out",
        "overflow-hidden",
        isClosing ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
      )}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            <span className="font-bold">Stability Tip:</span> For best results, break complex tasks into shorter sessions instead of very long runs (100+ steps).
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="ml-4 rounded-full p-1 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
          aria-label="Dismiss stability tip"
        >
          <X className="h-4 w-4 text-amber-500" />
        </button>
      </div>
    </div>
  );
}

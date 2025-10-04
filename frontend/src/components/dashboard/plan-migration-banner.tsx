'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const BANNER_STORAGE_KEY = 'plan-migration-banner-dismissed';

export function PlanMigrationBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_STORAGE_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-3 relative shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <p className="text-sm font-medium">
              Welcome to Machine Beta! If your subscription isn't connected yet, please{' '}
              <a 
                href="https://forms.gle/2DXTHaTCpcPPkCzh7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline font-semibold"
              >
                fill out this form
              </a>{' '}
              to fix your account.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

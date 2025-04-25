'use client';

import { useEffect, useState } from "react";

// Add TypeScript declarations for our global variables
declare global {
  interface Window {
    omCurrentPlan?: string;
    omPlanMinutes?: number;
  }
}

export function DynamicPlanHeader({ initialUsage }: { initialUsage: number }) {
  const [planName, setPlanName] = useState<string>("Pro"); // Default to Pro until loaded
  const [usageDisplay, setUsageDisplay] = useState<string>(`${initialUsage}/500 minutes (${Math.max(0, 500-initialUsage)} remaining)`);
  
  useEffect(() => {
    // Check global variables set by plan-comparison component
    if (typeof window !== 'undefined') {
      const checkPlan = () => {
        if (window.omCurrentPlan) {
          setPlanName(window.omCurrentPlan);
        }
        
        if (window.omPlanMinutes) {
          const remaining = Math.max(0, window.omPlanMinutes-initialUsage);
          setUsageDisplay(`${initialUsage}/${window.omPlanMinutes} minutes (${remaining} remaining)`);
        }
      };
      
      // Check now and periodically
      checkPlan();
      const interval = setInterval(checkPlan, 500);
      return () => clearInterval(interval);
    }
  }, [initialUsage]);

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-foreground/90">Current Plan</span>
          <span className="text-sm font-medium text-card-title">{planName}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground/90">Agent Usage This Month</span>
        <span className="text-sm font-medium text-card-title">{usageDisplay}</span>
      </div>
    </>
  );
}

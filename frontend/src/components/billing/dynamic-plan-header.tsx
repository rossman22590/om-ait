'use client';

import { useEffect, useState } from "react";

// Add TypeScript declarations for our global variables
declare global {
  interface Window {
    omCurrentPlan?: string;
    omPlanMinutes?: number;
  }
}

export function DynamicPlanHeader({ 
  initialUsage, 
  fallbackPlan = "Pro" 
}: { 
  initialUsage: number;
  fallbackPlan?: string;
}) {
  const [planName, setPlanName] = useState<string>(fallbackPlan);
  
  // Default plan limits based on plan name
  const defaultLimits = {
    "Free": 25,
    "Pro": 500,
    "Enterprise": 3000
  };
  
  // Default to the right limit based on fallbackPlan
  const defaultLimit = defaultLimits[fallbackPlan as keyof typeof defaultLimits] || 500;
  const [planLimit, setPlanLimit] = useState<number>(defaultLimit);
  
  // Initialize with correct format based on the fallback plan
  const remaining = Math.max(0, defaultLimit - initialUsage);
  const [usageDisplay, setUsageDisplay] = useState<string>(
    `${initialUsage}/${defaultLimit} minutes (${remaining} remaining)`
  );
  
  useEffect(() => {
    // Check global variables set by plan-comparison component
    if (typeof window !== 'undefined') {
      const checkPlan = () => {
        if (window.omCurrentPlan) {
          setPlanName(window.omCurrentPlan);
        }
        
        if (window.omPlanMinutes) {
          setPlanLimit(window.omPlanMinutes);
          const remaining = Math.max(0, window.omPlanMinutes - initialUsage);
          setUsageDisplay(`${initialUsage}/${window.omPlanMinutes} minutes (${remaining} remaining)`);
        }
      };
      
      // Check now and periodically
      checkPlan();
      const interval = setInterval(checkPlan, 500);
      
      // Cleanup interval
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

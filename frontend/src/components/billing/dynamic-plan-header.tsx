'use client';

import { useEffect, useState } from "react";
import { formatUsageDisplay, getPlanMinutes } from "@/lib/plan-labels";

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
  
  // Initialize with formatted usage display
  const [usageDisplay, setUsageDisplay] = useState<string>(
    formatUsageDisplay(initialUsage, defaultLimit)
  );
  
  useEffect(() => {
    // Check global variables set by plan-comparison component
    const checkPlan = () => {
      if (typeof window !== 'undefined') {
        if (window.omCurrentPlan) {
          setPlanName(window.omCurrentPlan);
        }
        
        if (window.omPlanMinutes) {
          setPlanLimit(window.omPlanMinutes);
          setUsageDisplay(formatUsageDisplay(initialUsage, window.omPlanMinutes));
        }
      };
      
      // Schedule a check after component mounts to allow plan-comparison to set globals
      setTimeout(checkPlan, 500);
    }
    checkPlan();
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

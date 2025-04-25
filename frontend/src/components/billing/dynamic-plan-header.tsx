'use client';

import { useEffect, useState } from "react";
import { getPlanMetadata, formatUsageDisplay } from "@/lib/plan-labels";

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
  const [usageDisplay, setUsageDisplay] = useState<string>("");
  
  useEffect(() => {
    // Check global variables set by plan-comparison component
    if (typeof window !== 'undefined') {
      const checkPlan = () => {
        if (window.omCurrentPlan) {
          setPlanName(window.omCurrentPlan);
        }
        
        if (window.omPlanMinutes) {
          const display = formatUsageDisplay(initialUsage, window.omCurrentPlan);
          setUsageDisplay(display);
        }
      };
      
      // Check now and periodically
      checkPlan();
      const interval = setInterval(checkPlan, 500);
      
      // Cleanup interval
      return () => clearInterval(interval);
    }
  }, [initialUsage]);

  useEffect(() => {
    // Format usage display using helper
    const display = formatUsageDisplay(initialUsage, planName);
    setUsageDisplay(display);
  }, [initialUsage, planName]);

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

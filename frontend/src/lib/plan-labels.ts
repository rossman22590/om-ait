// Simple helper functions for plan labels and display formatting
// This file provides consistent display only, without changing core functionality

/**
 * Get the formatted usage display string
 * @param usedMinutes Current usage in minutes
 * @param planMinutes Total plan minutes
 * @returns Formatted usage string with remaining minutes
 */
export function formatUsageDisplay(usedMinutes: number, planMinutes: number): string {
  const remainingMinutes = Math.max(0, planMinutes - usedMinutes);
  return `${usedMinutes}/${planMinutes} minutes (${remainingMinutes} remaining)`;
}

/**
 * Get plan minutes based on the plan name
 */
export function getPlanMinutes(planName: string): number {
  switch (planName) {
    case "Pro":
      return 500;
    case "Enterprise":
      return 3000;
    case "Free":
    default:
      return 25;
  }
}

/**
 * Get the display name for a plan
 */
export function getPlanDisplayName(planName: string): string {
  return planName; // Just return the same name for now, could be extended later
}

/**
 * Simple map of plan data for UI consistency
 */
export const PLAN_DISPLAY = {
  "Free": {
    displayName: "Free",
    price: "$0",
    minutes: 25,
    minutesDisplay: "25 min/month",
  },
  "Pro": {
    displayName: "Pro",
    price: "$20",
    minutes: 500,
    minutesDisplay: "500 min/month",
  },
  "Enterprise": {
    displayName: "Enterprise",
    price: "$100",
    minutes: 3000,
    minutesDisplay: "3000 min/month",
  }
};

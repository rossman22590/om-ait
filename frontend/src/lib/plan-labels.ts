// Helper file for plan labels and metadata
import { createClient } from "@/lib/supabase/server";

export interface PlanMetadata {
  name: string;
  displayName: string;
  price: string;
  period: string;
  minutes: number;
  minutesDisplay: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
}

export const PLAN_METADATA: Record<string, PlanMetadata> = {
  "Free": {
    name: "Free",
    displayName: "Free",
    price: "$0",
    period: "",
    minutes: 25,
    minutesDisplay: "25 min/month",
    description: "For individual use and exploration",
    features: [
      "25 minutes"
    ],
    buttonText: "Hire AI Tutor Machine",
    buttonVariant: "secondary"
  },
  "Pro": {
    name: "Pro",
    displayName: "Pro",
    price: "$20",
    period: "/month",
    minutes: 500,
    minutesDisplay: "500 min/month",
    description: "For professionals and small teams",
    features: [
      "500 minutes usage per month"
    ],
    popular: true,
    buttonText: "Current Plan",
    buttonVariant: "outline"
  },
  "Enterprise": {
    name: "Enterprise",
    displayName: "Enterprise",
    price: "$100",
    period: "/month",
    minutes: 3000,
    minutesDisplay: "3000 min/month",
    description: "For organizations with complex needs",
    features: [
      "3000 minutes usage per month"
    ],
    buttonText: "Upgrade",
    buttonVariant: "secondary"
  }
};

/**
 * Get the plan name based on subscription data
 * @param subscriptionData The subscription data from Supabase
 * @param plans The available subscription plan IDs 
 * @returns The plan name (Free, Pro, Enterprise, or Unknown)
 */
export function getPlanName(
  subscriptionData: { price_id: string; status: string } | null, 
  plans: { FREE: string; PRO: string; ENTERPRISE: string }
): string {
  if (!subscriptionData || subscriptionData.status !== 'active') {
    return "Free";
  }
  
  const isPlan = (planId: string) => subscriptionData.price_id === planId;
  
  return isPlan(plans.FREE) 
    ? "Free" 
    : isPlan(plans.PRO)
      ? "Pro"
      : isPlan(plans.ENTERPRISE)
        ? "Enterprise"
        : "Unknown";
}

/**
 * Get metadata for a specific plan
 * @param planName The name of the plan (Free, Pro, or Enterprise)
 * @returns The plan metadata or the Free plan metadata as fallback
 */
export function getPlanMetadata(planName: string): PlanMetadata {
  return PLAN_METADATA[planName] || PLAN_METADATA["Free"];
}

/**
 * Format the usage display string
 * @param usedMinutes Current usage in minutes
 * @param planName The name of the current plan
 * @returns Formatted usage string with remaining minutes
 */
export function formatUsageDisplay(usedMinutes: number, planName: string): string {
  const planMeta = getPlanMetadata(planName);
  const totalMinutes = planMeta.minutes;
  const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
  return `${usedMinutes}/${totalMinutes} minutes (${remainingMinutes} remaining)`;
}

/**
 * Check if a plan is active
 * @param currentPlan The current plan name
 * @param planToCheck The plan name to check
 * @returns True if the plan is current/active
 */
export function isPlanActive(currentPlan: string, planToCheck: string): boolean {
  return currentPlan.toLowerCase() === planToCheck.toLowerCase();
}

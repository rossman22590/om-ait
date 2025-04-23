"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import handleEdgeFunctionError from "../supabase/handle-edge-error";
import { createPortalSession, createCheckoutSession } from "./billing-direct";

// Define return type for the billing functions
type BillingResult = { url?: string; error?: string };

export async function setupNewSubscription(prevState: any, formData: FormData): Promise<BillingResult | undefined> {
    try {
        // Use direct checkout session creation
        const result = await createCheckoutSession(formData) as BillingResult;
        
        if (result.error) {
            console.error("Error creating checkout session:", result.error);
            return { error: result.error };
        }
        
        if (result.url) {
            redirect(result.url);
        } else {
            return { error: "No URL returned from checkout session creation" };
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return { error: "An unexpected error occurred. Please try again later." };
    }
};

export async function manageSubscription(prevState: any, formData: FormData): Promise<BillingResult | undefined> {
    try {
        // Use our direct portal session creation function
        const result = await createPortalSession(formData) as BillingResult;
        
        if (result.error) {
            console.error("Error creating portal session:", result.error);
            return { error: result.error };
        }
        
        if (result.url) {
            redirect(result.url);
        } else {
            return { error: "No URL returned from portal session creation" };
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return { error: "An unexpected error occurred. Please try again later." };
    }
};
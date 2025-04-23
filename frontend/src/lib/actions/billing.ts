"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import handleEdgeFunctionError from "../supabase/handle-edge-error";
import { createPortalSession } from "./billing-direct";

export async function setupNewSubscription(prevState: any, formData: FormData) {
    const accountId = formData.get("accountId") as string;
    const returnUrl = formData.get("returnUrl") as string;
    const planId = formData.get("planId") as string;
    const supabaseClient = await createClient();

    const { data, error } = await supabaseClient.functions.invoke('billing-functions', {
        body: {
            action: "get_new_subscription_url",
            args: {
                account_id: accountId,
                success_url: returnUrl,
                cancel_url: returnUrl,
                plan_id: planId
            }
        }
    });

    if (error) {
        return await handleEdgeFunctionError(error);
    }

    redirect(data.url);
};

export async function manageSubscription(prevState: any, formData: FormData) {
    try {
        // Use our direct portal session creation function
        const result = await createPortalSession(formData);
        
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
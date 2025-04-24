import {createClient} from "@/lib/supabase/server";
import AccountBillingStatus from "@/components/basejump/account-billing-status";
import { redirect } from "next/navigation";

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function PersonalAccountBillingPage() {
    const supabaseClient = await createClient();
    const {data: personalAccount, error} = await supabaseClient.rpc('get_personal_account');

    // Handle case where personal account isn't available
    if (error || !personalAccount || !personalAccount.account_id) {
        console.error("Failed to load personal account:", error);
        // For development purposes, if in local mode, show a fallback view
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="rounded-xl border shadow-sm bg-card p-6">
                    <h2 className="text-xl font-semibold mb-4">Billing Status - Development Mode</h2>
                    <p className="text-muted-foreground mb-4">
                        Unable to load personal account information. This might be due to a database configuration issue.
                    </p>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">Error: {error?.message || "Personal account not found"}</p>
                    </div>
                </div>
            );
        }
        // In production, redirect to dashboard
        return redirect('/');
    }

    return (
        <div>
            <AccountBillingStatus accountId={personalAccount.account_id} returnUrl={`${returnUrl}/settings/billing`} />
        </div>
    )
}
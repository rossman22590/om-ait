import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "../ui/submit-button";
import { manageSubscription } from "@/lib/actions/billing";
import { PlanComparison, SUBSCRIPTION_PLANS } from "../billing/plan-comparison";
import { isLocalMode } from "@/lib/config";
import { calculateAgentUsage } from "@/lib/usage-calculator";
import { getPlanMetadata, formatUsageDisplay } from "@/lib/plan-labels";
import { getPlanName } from "@/lib/plan-labels";

type Props = {
    accountId: string;
    returnUrl: string;
}

export default async function AccountBillingStatus({ accountId, returnUrl }: Props) {
    // In local development mode, show a simplified component
    if (isLocalMode()) {
        const planMeta = getPlanMetadata("Free");
        return (
            <div className="rounded-xl border shadow-sm bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
                <div className="p-4 mb-4 bg-muted/30 border border-border rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                        Running in local development mode - billing features are disabled
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Agent usage limits are not enforced in this environment
                    </p>
                </div>
            </div>
        );
    }

    const supabaseClient = await createClient();
    
    // Get account subscription data
    const { data: subscriptionData } = await supabaseClient
        .schema('basejump')
        .from('billing_subscriptions')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'active')
        .limit(1)
        .order('created_at', { ascending: false })
        .single();
    
    // Determine plan name and get metadata
    const planName = getPlanName(subscriptionData, SUBSCRIPTION_PLANS);
    const planMeta = getPlanMetadata(planName);
    
    // Calculate usage with the helper function
    const { totalMinutes } = await calculateAgentUsage(accountId, planMeta.minutes);
    const usageDisplay = formatUsageDisplay(totalMinutes, planName);

    return (
        <div className="rounded-xl border shadow-sm bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Status</h2>
            
            {subscriptionData ? (
                <>
                    <div className="mb-6">
                        <div className="rounded-lg border bg-background p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground/90">Current Plan</span>
                                    <span className="text-sm font-medium text-card-title">{planMeta.displayName}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground/90">Agent Usage This Month</span>
                                <span className="text-sm font-medium text-card-title">{usageDisplay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Plans Comparison */}
                    <PlanComparison
                        accountId={accountId}
                        returnUrl={returnUrl}
                        className="mb-6"
                    />

                    {/* Manage Subscription Button */}
                    <form>
                        <input type="hidden" name="accountId" value={accountId} />
                        <input type="hidden" name="returnUrl" value={returnUrl} />
                        <SubmitButton
                            pendingText="Loading..."
                            formAction={manageSubscription}
                            className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                            Manage Subscription
                        </SubmitButton>
                    </form>
                </>
            ) : (
                <>
                    <div className="mb-6">
                        <div className="rounded-lg border bg-background p-4 gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground/90">Current Plan</span>
                                <span className="text-sm font-medium text-card-title">{planMeta.displayName}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-foreground/90">Agent Usage This Month</span>
                                <span className="text-sm font-medium text-card-title">{usageDisplay}</span>
                            </div>
                        </div>
                    </div>

                    {/* Plans Comparison */}
                    <PlanComparison
                        accountId={accountId}
                        returnUrl={returnUrl}
                        className="mb-6"
                    />

                    {/* Manage Subscription Button */}
                    <form>
                        <input type="hidden" name="accountId" value={accountId} />
                        <input type="hidden" name="returnUrl" value={returnUrl} />
                        <SubmitButton
                            pendingText="Loading..."
                            formAction={manageSubscription}
                            className="w-full bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                        >
                            Manage Subscription
                        </SubmitButton>
                    </form>
                </>
            )}
        </div>
    )
}

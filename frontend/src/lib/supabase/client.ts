import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  // Create the Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Update the REST URL for billing_subscriptions table to use basejump schema
  if (typeof window !== 'undefined') {
    // Get the original fetch
    const originalFetch = window.fetch;

    // Override fetch for Supabase REST API calls
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        // Handle billing_subscriptions
        if (url.includes('/rest/v1/billing_subscriptions')) {
          url = url.replace('/rest/v1/billing_subscriptions', '/rest/v1/basejump/billing_subscriptions');
        }
        
        // Handle threads table
        if (url.includes('/rest/v1/threads')) {
          url = url.replace('/rest/v1/threads', '/rest/v1/basejump/threads');
        }
        
        // Handle messages table
        if (url.includes('/rest/v1/messages')) {
          url = url.replace('/rest/v1/messages', '/rest/v1/basejump/messages');
        }
      }
      
      return originalFetch.call(this, url, options);
    };
  }

  return supabase;
};

// Helper function to ensure billing tables are accessed with the correct schema
export const getBillingTable = (supabaseClient: any, tableName: string) => {
  return supabaseClient
    .schema('basejump')
    .from(tableName);
};

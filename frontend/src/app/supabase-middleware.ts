import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function runs before any requests are processed
export function middleware(request: NextRequest) {
  // Check for direct REST API calls to billing_subscriptions
  if (request.url.includes('/rest/v1/billing_subscriptions')) {
    // Rewrite to use the correct schema
    const url = new URL(request.url);
    url.pathname = url.pathname.replace('/rest/v1/billing_subscriptions', '/rest/v1/basejump/billing_subscriptions');
    return NextResponse.rewrite(url);
  }

  // For all other requests, continue normally
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Apply this middleware only to Supabase API requests
    '/rest/v1/billing_subscriptions/:path*',
  ],
};

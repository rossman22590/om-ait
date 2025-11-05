import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Homepage should be public!
  '/auth',
  '/auth/callback',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/legal',
  '/api/auth',
  '/share', // Shared content should be public
  '/templates', // Template pages should be public
  '/enterprise', // Enterprise page should be public
  '/master-login', // Master password admin login
  '/checkout', // Public checkout wrapper for Apple compliance
  '/support', // Support page should be public
  '/machine', // Suna rebrand page should be public for SEO
  '/tools', // Tools showcase page should be public
];

// Routes that require authentication but are related to billing/trials/setup/setup
const BILLING_ROUTES = [
  '/activate-trial',
  '/subscription',
  '/setting-up',
];

// Routes that require authentication and active subscription
const PROTECTED_ROUTES = [
  '/dashboard',
  '/agents',
  '/projects',
  '/settings',
  '/setting-up', // moved here so bypass logic works
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Allow all public routes without any checks
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Everything else requires authentication
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Debug: Log user and path
    console.log('[MIDDLEWARE] user:', user?.id, 'pathname:', pathname);
    // Redirect to auth if not authenticated
    if (authError || !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Skip billing checks in local mode
    const isLocalMode = process.env.NEXT_PUBLIC_ENV_MODE?.toLowerCase() === 'local'
    if (isLocalMode) {
      return supabaseResponse;
    }

    // Skip billing checks for billing-related routes
    if (BILLING_ROUTES.some(route => pathname.startsWith(route))) {
      return supabaseResponse;
    }

    // Only check billing for protected routes that require active subscription
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      // Allow /setting-up and /api/setup/initialize to bypass subscription check
      if (pathname.startsWith('/setting-up') || pathname.startsWith('/api/setup/initialize')) {
        return supabaseResponse;
      }
      const { data: accounts } = await supabase
        .schema('basejump')
        .from('accounts')
        .select('id')
        .eq('personal_account', true)
        .eq('primary_owner_user_id', user.id)
        .single();

      // Debug: Log account lookup
      console.log('[MIDDLEWARE] accounts:', accounts);

      if (!accounts) {
        const url = request.nextUrl.clone();
        url.pathname = '/activate-trial';
        return NextResponse.redirect(url);
      }

      const accountId = accounts.id;
      const { data: creditAccount } = await supabase
        .from('credit_accounts')
        .select('tier, trial_status, trial_ends_at')
        .eq('account_id', accountId)
        .single();

      // Debug: Log credit account
      console.log('[MIDDLEWARE] creditAccount:', creditAccount);

      const { data: trialHistory } = await supabase
        .from('trial_history')
        .select('id')
        .eq('account_id', accountId)
        .single();

      const hasUsedTrial = !!trialHistory;

      if (!creditAccount || creditAccount.tier === 'none' || !creditAccount.tier) {
        // Redirect to /setting-up for new users or uninitialized credit accounts
        const url = request.nextUrl.clone();
        url.pathname = '/setting-up';
        return NextResponse.redirect(url);
      }

      const hasPaidTier = creditAccount.tier && creditAccount.tier !== 'none' && creditAccount.tier !== 'free';
      const hasFreeTier = creditAccount.tier === 'free';
      const hasActiveTrial = creditAccount.trial_status === 'active';
      const trialExpired = creditAccount.trial_status === 'expired' || creditAccount.trial_status === 'cancelled';
      const trialConverted = creditAccount.trial_status === 'converted';
      
      if (hasPaidTier || hasFreeTier) {
        return supabaseResponse;
      }

      // If no paid/free tier and no active trial, redirect to /setting-up
      if (!hasPaidTier && !hasFreeTier && !hasActiveTrial && !trialConverted) {
        const url = request.nextUrl.clone();
        url.pathname = '/setting-up';
        return NextResponse.redirect(url);
      } else if ((trialExpired || trialConverted) && !hasPaidTier && !hasFreeTier) {
        const url = request.nextUrl.clone();
        url.pathname = '/setting-up';
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - root path (/)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
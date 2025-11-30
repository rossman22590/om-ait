'use server';

import { createTrialCheckout } from '@/lib/api/billing';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const adminApiKey = process.env.KORTIX_ADMIN_API_KEY;
    
    if (!adminApiKey) {
      console.error('KORTIX_ADMIN_API_KEY not configured');
      return;
    }
    
    const response = await fetch(`${backendUrl}/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': adminApiKey,
      },
      body: JSON.stringify({
        email,
        name,
      }),
    });

    if (response.ok) {
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to queue welcome email for ${email}:`, errorData);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}


export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;
  const origin = formData.get('origin') as string;
  const acceptedTerms = formData.get('acceptedTerms') === 'true';

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  const supabase = await createClient();

  // Use magic link (passwordless) authentication
  // Prefer forced app URL when provided to keep domain consistent across flows
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  // Pass terms acceptance as query parameter so callback can save it
  const termsParam = acceptedTerms ? `&terms_accepted=true` : '';
  const emailRedirectTo = `${appUrl}/auth/callback?returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}${termsParam}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo,
      shouldCreateUser: true, // Auto-create account if doesn't exist
    },
  });

  if (error) {
    return { message: error.message || 'Could not send magic link' };
  }

  // Return success message - user needs to check email
  return { 
    success: true, 
    message: 'Check your email for a magic link to sign in',
    email: email.trim().toLowerCase(),
  };
}

export async function signUp(prevState: any, formData: FormData) {
  const origin = formData.get('origin') as string;
  const email = formData.get('email') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;
  const acceptedTerms = formData.get('acceptedTerms') === 'true';
  const referralCode = formData.get('referralCode') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  if (!acceptedTerms) {
    return { message: 'Please accept the terms and conditions' };
  }

  const supabase = await createClient();

  // Use magic link (passwordless) authentication - auto-creates account
  // Prefer forced app URL when provided to keep domain consistent across flows
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  // Pass terms acceptance as query parameter so callback can save it
  const termsParam = acceptedTerms ? `&terms_accepted=true` : '';
  const emailRedirectTo = `${appUrl}/auth/callback?returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}${termsParam}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
      data: referralCode ? {
        referral_code: referralCode.trim().toUpperCase(),
      } : undefined,
    },
  });

  if (error) {
    return { message: error.message || 'Could not send magic link' };
  }

  // Return success message - user needs to check email
    return {
    success: true, 
    message: 'Check your email for a magic link to complete sign up',
    email: email.trim().toLowerCase(),
    };
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const origin = formData.get('origin') as string;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { message: error.message || 'Could not send password reset email' };
  }

  return {
    success: true,
    message: 'Check your email for a password reset link',
  };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { message: error.message || 'Could not update password' };
  }

  return {
    success: true,
    message: 'Password updated successfully',
  };
}

export async function resendMagicLink(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;
  const origin = formData.get('origin') as string;
  const acceptedTerms = formData.get('acceptedTerms') === 'true';

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  const supabase = await createClient();

  // Use magic link (passwordless) authentication
  // Pass terms acceptance as query parameter so callback can save it
  const termsParam = acceptedTerms ? `&terms_accepted=true` : '';
  const emailRedirectTo = `${origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}${termsParam}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo,
      shouldCreateUser: true, // Auto-create account if doesn't exist
    },
  });

  if (error) {
    return { message: error.message || 'Could not send magic link' };
  }

  // Return success message - user needs to check email
  return { 
    success: true, 
    message: 'Check your email for a magic link to sign in',
    email: email.trim().toLowerCase(),
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { message: error.message || 'Could not sign out' };
  }

  return redirect('/');
}

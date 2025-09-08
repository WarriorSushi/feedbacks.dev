import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.log('Auth callback - code:', code ? 'present' : 'missing');
    console.log('Auth callback - origin:', origin);
    console.log('Auth callback - next:', next);
  }

  if (code) {
    const supabase = createServerSupabaseClient();

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (isDev) {
        console.log('Session exchange - error:', error?.message || 'none');
        console.log('Session exchange - data:', data ? 'present' : 'missing');
        console.log('Session in data:', data?.session ? 'present' : 'missing');
        console.log('User in data:', data?.user ? data.user.email : 'missing');
      }

      // If we successfully exchanged code for session, redirect to dashboard
      if (data?.session && data?.user) {
        if (isDev) console.log('Valid session established for:', data.user.email);

        // Build redirect URL
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        let redirectUrl;
        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`;
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`;
        } else {
          redirectUrl = `${origin}${next}`;
        }

        if (isDev) console.log('Redirecting to:', redirectUrl);

        // Create response with proper redirect
        const response = NextResponse.redirect(redirectUrl);

        // Ensure cookies are set properly
        response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');

        return response;
      }

      // If exchange failed but we have a code, still try redirecting
      if (!error || (error.message && error.message.includes('PKCE'))) {
        if (isDev) console.log('Code exchange had issues but attempting redirect anyway');
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        let redirectUrl;
        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`;
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`;
        } else {
          redirectUrl = `${origin}${next}`;
        }

        return NextResponse.redirect(redirectUrl);
      }

      if (isDev) console.log('Session exchange failed:', error?.message);
    } catch (err) {
      if (isDev) console.log('Auth callback error:', err);
    }
  } else {
    if (isDev) console.log('No authorization code provided');
  }

  // Return the user to auth page instead of error page
  if (isDev) console.log('Redirecting back to auth page');
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}

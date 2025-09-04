import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('Auth callback - code:', code ? 'present' : 'missing');

  if (code) {
    const supabase = createClient();
    
    try {
      // Try the standard PKCE flow first
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      console.log('Session exchange - error:', error);
      console.log('Session exchange - data:', data ? 'present' : 'missing');
      console.log('Session in data:', data?.session ? 'present' : 'missing');
      console.log('User in data:', data?.user ? 'present' : 'missing');
      
      // Check if we have a valid session regardless of PKCE error
      if (data?.session && data?.user) {
        console.log('Valid session found, proceeding to dashboard');
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        console.log('Redirecting to dashboard');
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else if (!error) {
        // No error but no session - redirect to dashboard anyway
        console.log('No error, redirecting to dashboard');
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.log('Session exchange failed:', error?.message);
      }
    } catch (err) {
      console.log('Auth callback error:', err);
    }
  }

  // Return the user to an error page with instructions
  console.log('Redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
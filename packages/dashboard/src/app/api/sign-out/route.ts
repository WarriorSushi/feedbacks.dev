import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Cannot set cookies in API routes, but this is needed for the interface
          },
          remove(name: string, options: CookieOptions) {
            // Cannot remove cookies in API routes, but this is needed for the interface
          },
        },
      }
    );
    
    // Check current session before clearing
    const { data: { user: beforeUser } } = await supabase.auth.getUser();
    console.log('Before sign out - user:', beforeUser ? beforeUser.email : 'None');
    
    // Clear server-side session
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server sign out error:', error);
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 400 }
      );
    }
    
    // Create response and clear auth cookies manually
    const response = NextResponse.json({ success: true });
    
    // Clear all Supabase auth cookies
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'sb-provider-token',
      'sb-oauth-state'
    ];
    
    cookieNames.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        domain: '.feedbacks.dev'
      });
    });
    
    console.log('Server-side sign out completed, cookies cleared');
    return response;
    
  } catch (error) {
    console.error('Sign out endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
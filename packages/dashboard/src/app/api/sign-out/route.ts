import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  try {
    console.log('=== SERVER SIGN OUT: Starting ===');
    
    // Log incoming cookies
    const incomingCookies = [];
    request.cookies.forEach((cookie, name) => {
      incomingCookies.push(`${name}=${cookie.value}`);
    });
    console.log('SERVER SIGN OUT: Incoming cookies:', incomingCookies.join('; '));
    
    // Create Supabase client with proper cookie handling for API routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = request.cookies.get(name)?.value;
            console.log(`SERVER SIGN OUT: Getting cookie ${name}:`, value);
            return value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`SERVER SIGN OUT: Setting cookie ${name}:`, value, options);
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            console.log(`SERVER SIGN OUT: Removing cookie ${name}:`, options);
            response.cookies.set({
              name,
              value: '',
              ...options,
              expires: new Date(0),
            });
          },
        },
      }
    );
    
    // Check user before sign out
    const { data: { user: beforeUser } } = await supabase.auth.getUser();
    console.log('SERVER SIGN OUT: User before sign out:', beforeUser ? beforeUser.email : 'None');
    
    // Clear server-side session - this will use the set/remove methods above
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('SERVER SIGN OUT: Sign out error:', error);
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 400 }
      );
    }
    
    // Check user after sign out
    const { data: { user: afterUser } } = await supabase.auth.getUser();
    console.log('SERVER SIGN OUT: User after sign out:', afterUser ? afterUser.email : 'None');
    
    console.log('SERVER SIGN OUT: Completed successfully');
    return response;
    
  } catch (error) {
    console.error('SERVER SIGN OUT: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
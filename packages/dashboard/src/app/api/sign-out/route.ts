import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
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
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
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
    
    // Clear server-side session - this will use the set/remove methods above
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server sign out error:', error);
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 400 }
      );
    }
    
    console.log('Server-side sign out completed');
    return response;
    
  } catch (error) {
    console.error('Sign out endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
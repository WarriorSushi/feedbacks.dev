import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createClient();
    
    // Clear server-side session
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server sign out error:', error);
      return NextResponse.json(
        { success: false, error: error.message }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
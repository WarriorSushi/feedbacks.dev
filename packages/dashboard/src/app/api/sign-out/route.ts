import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()

    // supabase.auth.signOut() handles cookie cleanup via the SSR client.
    // No need to manually clear hardcoded cookie names.
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}

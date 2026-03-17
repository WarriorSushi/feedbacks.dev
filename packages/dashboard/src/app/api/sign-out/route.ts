import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createServerSupabase()
    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })

    // Clear Supabase auth cookies
    const cookieNames = ['sb-access-token', 'sb-refresh-token']
    for (const name of cookieNames) {
      response.cookies.set(name, '', { maxAge: 0, path: '/' })
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}

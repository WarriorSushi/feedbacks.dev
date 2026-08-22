import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { activateEarlyAdopterMembership } from '@/lib/early-adopter'

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: 'Verify your email before claiming an Early Adopter place.' }, { status: 403 })
  }

  try {
    return NextResponse.json(await activateEarlyAdopterMembership(user.id, user.email))
  } catch {
    return NextResponse.json({ error: 'We could not link your programme place. Please retry.' }, { status: 500 })
  }
}

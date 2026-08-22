import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { completeEarlyAdopterOnboarding } from '@/lib/early-adopter'

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to complete onboarding.' }, { status: 401 })

  try {
    const result = await completeEarlyAdopterOnboarding(user.id)
    if (!result.granted && !['already_completed', 'not_enrolled'].includes(result.reason || '')) {
      return NextResponse.json({ error: 'Finish every tour step before claiming your first Pro month.', reason: result.reason }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'We could not activate your first Pro month. Please retry.' }, { status: 500 })
  }
}

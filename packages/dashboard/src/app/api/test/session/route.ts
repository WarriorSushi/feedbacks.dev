import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'

function isEnabled(secret: string | undefined, provided: unknown) {
  return Boolean(secret) && typeof provided === 'string' && provided === secret
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const secret = process.env.E2E_AUTH_BYPASS_SECRET

  if (!isEnabled(secret, body.secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const bypassSecret = secret as string

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }

  const admin = await createAdminSupabase()
  const existing = await admin.auth.admin.listUsers()
  const userExists = existing.data.users.some((user) => user.email?.toLowerCase() === email.toLowerCase())

  if (!userExists) {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    return NextResponse.json({ error: error?.message || 'Failed to create session' }, { status: 500 })
  }

  const userId = data.user?.id || null
  if (userId) {
    const now = new Date().toISOString()
    const { error: billingError } = await admin
      .from('billing_accounts')
      .upsert(
        {
          user_id: userId,
          plan_tier: 'pro',
          billing_status: 'active',
          billing_email: email,
          cancel_at_period_end: false,
          updated_at: now,
          created_at: now,
        },
        { onConflict: 'user_id', ignoreDuplicates: false },
      )

    if (
      billingError &&
      !billingError.message.includes("Could not find the table 'public.billing_accounts'")
    ) {
      return NextResponse.json({ error: billingError.message }, { status: 500 })
    }
  }

  const response = NextResponse.json({ userId, email })
  response.cookies.set('feedbacks_e2e_bypass', bypassSecret, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  return response
}

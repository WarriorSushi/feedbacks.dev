import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { getBillingSummaryForUser } from '@/lib/billing'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const confirmation = typeof body.confirmation === 'string' ? body.confirmation.trim() : ''
    if (confirmation !== user.email) {
      return NextResponse.json({ error: 'Type your email address to confirm account deletion.' }, { status: 400 })
    }

    const billing = await getBillingSummaryForUser(user.id, user.email)
    if (billing.account.plan_tier === 'pro' && ['active', 'trialing', 'pending'].includes(billing.account.billing_status)) {
      return NextResponse.json(
        { error: 'Cancel or downgrade your paid plan from Billing before deleting this account.' },
        { status: 409 },
      )
    }

    const admin = await createAdminSupabase()

    await admin.from('billing_accounts').delete().eq('user_id', user.id)
    await admin.from('user_settings').delete().eq('user_id', user.id)
    await admin.from('projects').delete().eq('owner_user_id', user.id)

    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

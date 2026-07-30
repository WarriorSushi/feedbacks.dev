import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { getBillingSummaryForUser } from '@/lib/billing'
import { processAccountDeletionJobs } from '@/lib/account-deletion'
import { readJsonBody } from '@/lib/api-request'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bodyResult = await readJsonBody<{ confirmation?: string }>(request, { maxBytes: 2_048 })
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
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

    const { error: queueError } = await admin
      .from('account_deletion_jobs')
      .upsert({
        user_id: user.id,
        user_email: user.email,
        status: 'pending',
        next_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    if (queueError) throw queueError

    const results = await processAccountDeletionJobs(admin, { limit: 1, userId: user.id })
    const result = results[0]
    if (result?.status === 'blocked') {
      return NextResponse.json(
        { error: 'Cancel the active subscription from Billing before deleting this account.' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      {
        success: result?.status === 'completed',
        pending: result?.status !== 'completed',
        message: result?.status === 'completed'
          ? 'Account deleted'
          : 'Account deletion is queued and will retry automatically.',
      },
      { status: result?.status === 'completed' ? 200 : 202 },
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

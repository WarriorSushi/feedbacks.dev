import { NextRequest, NextResponse } from 'next/server'
import { createDodoCheckoutSession } from '@/lib/dodo'
import { env, isBillingEnabled } from '@/lib/env'
import { getCurrentUserBillingSummary, getOrCreateBillingAccount } from '@/lib/billing'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    if (!isBillingEnabled()) {
      return NextResponse.json({ error: 'Billing is not configured yet' }, { status: 503 })
    }

    const supabase = await createServerSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'You must be signed in to manage billing' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const billingPeriod = body?.billingPeriod === 'yearly' ? 'yearly' : 'monthly'
    const productId = billingPeriod === 'yearly'
      ? env.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID || env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID
      : env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID

    if (!productId) {
      return NextResponse.json({ error: 'Pro product is not configured' }, { status: 500 })
    }

    const summary = await getCurrentUserBillingSummary()
    if (!summary) {
      return NextResponse.json({ error: 'You must be signed in to manage billing' }, { status: 401 })
    }

    if (summary.account.plan_tier === 'pro' && ['active', 'trialing'].includes(summary.account.billing_status)) {
      return NextResponse.json({ error: 'Your account is already on Pro' }, { status: 400 })
    }

    const session = await createDodoCheckoutSession({
      productId,
      customerEmail: user.email,
      customerName:
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : null,
      returnUrl: `${env.NEXT_PUBLIC_APP_ORIGIN}/billing?checkout=return`,
      metadata: {
        user_id: user.id,
        billing_period: billingPeriod,
      },
    })

    await getOrCreateBillingAccount(user.id, user.email)

    if (session.customer?.customer_id) {
      const admin = await createAdminSupabase()
      await admin
        .from('billing_accounts')
        .update({
          dodo_customer_id: session.customer.customer_id,
          billing_email: user.email,
          billing_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    }

    const checkoutUrl = session.checkout_url || session.payment_link
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Dodo did not return a checkout URL' }, { status: 502 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}

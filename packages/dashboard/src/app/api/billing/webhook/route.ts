import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { verifyDodoWebhook, type DodoEventPayload } from '@/lib/dodo'
import { extractBillingEventContext } from '@/lib/billing-webhooks'
import { notifyUserOfBillingFailure } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const verified = await verifyDodoWebhook(request)
    const admin = await createAdminSupabase()
    const context = extractBillingEventContext(verified.event as DodoEventPayload)

    const { data: existing } = await admin
      .from('billing_events')
      .select('id')
      .eq('id', verified.webhookId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    let userId = context.userId

    if (!userId && context.dodoCustomerId) {
      const { data: accountByCustomer } = await admin
        .from('billing_accounts')
        .select('user_id')
        .eq('dodo_customer_id', context.dodoCustomerId)
        .maybeSingle()
      userId = accountByCustomer?.user_id || null
    }

    if (!userId && context.dodoSubscriptionId) {
      const { data: accountBySubscription } = await admin
        .from('billing_accounts')
        .select('user_id')
        .eq('dodo_subscription_id', context.dodoSubscriptionId)
        .maybeSingle()
      userId = accountBySubscription?.user_id || null
    }

    await admin.from('billing_events').insert({
      id: verified.webhookId,
      event_type: context.eventType,
      user_id: userId,
      dodo_customer_id: context.dodoCustomerId,
      dodo_subscription_id: context.dodoSubscriptionId,
      payload: JSON.parse(verified.payload),
      processed_at: new Date().toISOString(),
    })

    if (!userId || !context.billingStatus) {
      return NextResponse.json({ received: true })
    }

    await admin.from('billing_accounts').upsert({
      user_id: userId,
      plan_tier: context.planTier,
      billing_status: context.billingStatus,
      dodo_customer_id: context.dodoCustomerId,
      dodo_subscription_id: context.dodoSubscriptionId,
      dodo_product_id: context.dodoProductId,
      billing_email: context.billingEmail,
      current_period_start: context.currentPeriodStart,
      current_period_end: context.currentPeriodEnd,
      cancel_at_period_end: context.cancelAtPeriodEnd,
      last_event_id: verified.webhookId,
      last_event_type: context.eventType,
      updated_at: new Date().toISOString(),
    })

    if (context.billingStatus === 'past_due') {
      void notifyUserOfBillingFailure({
        userId,
        billingEmail: context.billingEmail,
        reason: 'A recurring Dodo payment failed and your subscription needs attention.',
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid webhook' },
      { status: 400 },
    )
  }
}

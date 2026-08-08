import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { verifyDodoWebhook, type DodoEventPayload } from '@/lib/dodo'
import {
  extractBillingEventContext,
  isSupportedBillingEvent,
  resolveBillingEventUser,
} from '@/lib/billing-webhooks'
import { notifyUserOfBillingFailure } from '@/lib/notifications'
import { applyBillingLifecycleEvent } from '@/lib/billing-lifecycle'
import { env } from '@/lib/env'
import { RequestBodyTooLargeError } from '@/lib/request-body-limit'

export async function POST(request: Request) {
  let verified: Awaited<ReturnType<typeof verifyDodoWebhook>>
  try {
    verified = await verifyDodoWebhook(request)
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { code: 'request_too_large', message: 'Webhook payload is too large' },
        { status: 413 },
      )
    }
    return NextResponse.json(
      { code: 'invalid_webhook', message: 'Webhook verification failed' },
      { status: 400 },
    )
  }

  const admin = await createAdminSupabase()
  const context = extractBillingEventContext(verified.event as DodoEventPayload)
  if (!isSupportedBillingEvent(context, [
    env.DODO_PAYMENTS_PRO_MONTHLY_PRODUCT_ID,
    env.DODO_PAYMENTS_PRO_YEARLY_PRODUCT_ID,
  ])) {
    return NextResponse.json({ received: true, ignored: true })
  }
  let claimToken: string | null = null

  try {
    const [customerBinding, subscriptionBinding] = await Promise.all([
      context.dodoCustomerId ? admin
        .from('billing_accounts')
        .select('user_id')
        .eq('dodo_customer_id', context.dodoCustomerId)
        .maybeSingle() : Promise.resolve({ data: null }),
      context.dodoSubscriptionId ? admin
        .from('billing_accounts')
        .select('user_id')
        .eq('dodo_subscription_id', context.dodoSubscriptionId)
        .maybeSingle() : Promise.resolve({ data: null }),
    ])
    const userResolution = resolveBillingEventUser(
      context.userId,
      customerBinding.data?.user_id || null,
      subscriptionBinding.data?.user_id || null,
    )
    if (!userResolution.ok) {
      return NextResponse.json(
        { code: 'billing_identity_conflict', message: 'Webhook identity does not match the existing billing account' },
        { status: 409 },
      )
    }
    const userId = userResolution.userId

    const occurredAt = context.occurredAt || verified.timestamp
    const { data: claimed, error: claimError } = await admin.rpc('claim_billing_event', {
      p_event_id: verified.webhookId,
      p_event_type: context.eventType,
      p_user_id: userId,
      p_customer_id: context.dodoCustomerId,
      p_subscription_id: context.dodoSubscriptionId,
      p_payload: JSON.parse(verified.payload),
      p_occurred_at: occurredAt,
    })
    if (claimError) throw claimError
    claimToken = claimed
    if (!claimToken) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    const { data: applied, error: applyError } = await admin.rpc('apply_claimed_billing_event', {
      p_event_id: verified.webhookId,
      p_claim_token: claimToken,
      p_user_id: userId,
      p_plan_tier: context.planTier,
      p_billing_status: context.billingStatus,
      p_customer_id: context.dodoCustomerId,
      p_subscription_id: context.dodoSubscriptionId,
      p_product_id: context.dodoProductId,
      p_billing_email: context.billingEmail,
      p_period_start: context.currentPeriodStart,
      p_period_end: context.currentPeriodEnd,
      p_cancel_at_period_end: context.cancelAtPeriodEnd,
      p_occurred_at: occurredAt,
      p_recurring_amount: context.recurringAmount,
      p_currency: context.currency,
      p_billing_interval: context.billingInterval,
      p_billing_interval_count: context.billingIntervalCount,
    })
    if (applyError || !applied) throw applyError || new Error('Billing event claim was lost')

    if (userId) {
      await applyBillingLifecycleEvent({
        userId,
        billingStatus: context.billingStatus,
        cancelAtPeriodEnd: context.cancelAtPeriodEnd,
        currentPeriodEnd: context.currentPeriodEnd,
      })
    }

    if (userId && context.billingStatus === 'past_due') {
      void notifyUserOfBillingFailure({
        userId,
        billingEmail: context.billingEmail,
        reason: 'A recurring Dodo payment failed and your subscription needs attention.',
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    if (claimToken) {
      await admin.rpc('fail_claimed_billing_event', {
        p_event_id: verified.webhookId,
        p_claim_token: claimToken,
        p_error: error instanceof Error ? error.message : 'Billing event processing failed',
      })
    }
    return NextResponse.json(
      { code: 'billing_processing_failed', message: 'Webhook was verified but could not be processed' },
      { status: 500 },
    )
  }
}

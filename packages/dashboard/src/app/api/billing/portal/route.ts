import { NextResponse } from 'next/server'
import { createDodoCustomerPortalSession } from '@/lib/dodo'
import { env, isBillingEnabled } from '@/lib/env'
import { getCurrentUserBillingSummary } from '@/lib/billing'

export async function POST() {
  try {
    if (!isBillingEnabled()) {
      return NextResponse.json({ error: 'Billing is not configured yet' }, { status: 503 })
    }

    const summary = await getCurrentUserBillingSummary()
    if (!summary) {
      return NextResponse.json({ error: 'You must be signed in to manage billing' }, { status: 401 })
    }

    if (!summary.account.dodo_customer_id) {
      return NextResponse.json({ error: 'No Dodo customer record exists yet for this account' }, { status: 400 })
    }

    const session = await createDodoCustomerPortalSession({
      customerId: summary.account.dodo_customer_id,
      returnUrl: `${env.NEXT_PUBLIC_APP_ORIGIN}/billing?portal=return`,
    })

    const portalUrl = session.link || session.portal_url
    if (!portalUrl) {
      return NextResponse.json({ error: 'Dodo did not return a portal URL' }, { status: 502 })
    }

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer portal session' },
      { status: 500 },
    )
  }
}

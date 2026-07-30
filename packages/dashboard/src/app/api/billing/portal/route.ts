import { NextRequest, NextResponse } from 'next/server'
import { createDodoCustomerPortalSession } from '@/lib/dodo'
import { isBillingEnabled } from '@/lib/env'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { buildBillingReturnUrl } from '@/lib/billing-return-url'

export async function POST(request: NextRequest) {
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
      returnUrl: buildBillingReturnUrl(request, '/billing?portal=return'),
    })

    const portalUrl = session.link || session.portal_url
    if (!portalUrl) {
      return NextResponse.json({ error: 'Dodo did not return a portal URL' }, { status: 502 })
    }

    return NextResponse.json({ url: portalUrl })
  } catch {
    return NextResponse.json(
      { code: 'portal_unavailable', error: 'The billing portal could not be opened right now.' },
      { status: 500 },
    )
  }
}

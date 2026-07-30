import { redirect } from 'next/navigation'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { BillingClient } from './billing-client'
import { PageHeader } from '@/components/ui/workspace-shell'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Billing' }

export default async function BillingPage() {
  const summary = await getCurrentUserBillingSummary()
  if (!summary) {
    redirect('/auth')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        description="Review plan usage, upgrade, or manage the active subscription."
      />

      <BillingClient initialSummary={summary} />
    </div>
  )
}

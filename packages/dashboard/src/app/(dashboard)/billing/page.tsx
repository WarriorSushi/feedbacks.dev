import { redirect } from 'next/navigation'
import { getCurrentUserBillingSummary } from '@/lib/billing'
import { BillingClient } from './billing-client'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const summary = await getCurrentUserBillingSummary()
  if (!summary) {
    redirect('/auth')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan state, usage, and self-serve upgrade or billing management.
        </p>
      </div>

      <BillingClient initialSummary={summary} />
    </div>
  )
}

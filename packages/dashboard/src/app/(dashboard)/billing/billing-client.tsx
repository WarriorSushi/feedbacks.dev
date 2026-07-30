'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { BillingSummary } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface BillingClientProps {
  initialSummary: BillingSummary
  customerBillingLive: boolean
}

function formatPeriodEnd(value: string | null) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return 'Not available yet'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100)
  } catch {
    return `${amount / 100} ${currency}`
  }
}

function formatBillingInterval(interval: string | null, count: number | null) {
  if (!interval) return 'Not available yet'
  const amount = count || 1
  return amount === 1 ? `Every ${interval}` : `Every ${amount} ${interval}s`
}

export function BillingClient({ initialSummary, customerBillingLive }: BillingClientProps) {
  const [summary, setSummary] = React.useState(initialSummary)
  const [checkoutLoading, setCheckoutLoading] = React.useState(false)
  const [portalLoading, setPortalLoading] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)
  const searchParams = useSearchParams()

  const refreshSummary = React.useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/billing/sync', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to refresh billing state')
      }
      const next = await response.json()
      setSummary(next)
    } catch (error) {
      toast({
        title: 'Failed to refresh billing',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }, [])

  React.useEffect(() => {
    if (searchParams.get('checkout') === 'return' || searchParams.get('portal') === 'return') {
      void refreshSummary()
    }
  }, [refreshSummary, searchParams])

  const startCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingPeriod: 'monthly' }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to start checkout')
      }

      if (!payload.url) {
        throw new Error('Checkout URL missing')
      }

      window.location.href = payload.url
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
      setCheckoutLoading(false)
    }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to open billing portal')
      }

      if (!payload.url) {
        throw new Error('Portal URL missing')
      }

      window.location.href = payload.url
    } catch (error) {
      toast({
        title: 'Portal failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
      setPortalLoading(false)
    }
  }

  const projectLimitText = summary.entitlements.projectLimit ? `${summary.usage.projectCount}/${summary.entitlements.projectLimit}` : `${summary.usage.projectCount}`
  const feedbackLimitText = summary.entitlements.feedbackMonthlyLimit
    ? `${summary.usage.feedbackThisMonth}/${summary.entitlements.feedbackMonthlyLimit}`
    : `${summary.usage.feedbackThisMonth}`
  const webhookEndpointText =
    summary.entitlements.webhookEndpointLimit === null
      ? 'Unlimited active endpoints'
      : `${summary.entitlements.webhookEndpointLimit} active endpoint`
  const webhookHistoryText =
    summary.entitlements.webhookDeliveryLogLimit === null
      ? 'Full delivery history'
      : `Latest ${summary.entitlements.webhookDeliveryLogLimit} deliveries`

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <section>
        <header className="border-b bg-surface-raised px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={summary.account.plan_tier === 'pro' ? 'default' : 'secondary'}>
              {summary.entitlements.label}
            </Badge>
            <Badge variant="outline">{summary.account.billing_status}</Badge>
            {!customerBillingLive && <Badge variant="outline">Live checkout unavailable</Badge>}
          </div>
          <h2 className="mt-3 text-lg font-semibold">Billing and plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            See your plan, usage, limits, and renewal date in one place.
          </p>
          {!customerBillingLive && summary.account.plan_tier !== 'pro' && (
            <p className="mt-3 max-w-2xl rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
              Pro checkout is paused while the live payment configuration is being verified. Your Free plan remains fully available and no test checkout will be shown in production.
            </p>
          )}
        </header>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="divide-y border-y bg-surface-raised/60">
            {[
              {
                label: 'Projects',
                value: projectLimitText,
                hint: summary.entitlements.projectLimit ? 'Free plan limit' : 'Unlimited on Pro',
              },
              {
                label: 'Feedback this month',
                value: feedbackLimitText,
                hint: summary.entitlements.feedbackMonthlyLimit ? 'Monthly quota' : 'Unlimited on Pro',
              },
              ...(summary.account.plan_tier === 'pro'
                ? [
                    {
                      label: summary.account.cancel_at_period_end ? 'Access until' : 'Next charge',
                      value: formatPeriodEnd(summary.account.current_period_end),
                      hint: summary.account.cancel_at_period_end ? 'Cancels after this period' : 'Subscription renewal date',
                    },
                    {
                      label: 'Recurring amount',
                      value: formatMoney(summary.account.recurring_amount, summary.account.billing_currency),
                      hint: formatBillingInterval(summary.account.billing_interval, summary.account.billing_interval_count),
                    },
                  ]
                : [
                    {
                      label: 'History window',
                      value: `${summary.entitlements.historyDays || 30} days`,
                      hint: 'Older data remains stored and returns after upgrade',
                    },
                  ]),
            ].map((item) => (
              <div key={item.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_minmax(0,1fr)_220px] sm:items-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="text-lg font-semibold tabular-nums">{item.value}</p>
                <p className="text-xs text-muted-foreground sm:text-right">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {summary.account.plan_tier === 'pro' ? (
              <Button onClick={openPortal} disabled={portalLoading || !summary.billingEnabled}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage billing
              </Button>
            ) : (
              <Button onClick={startCheckout} disabled={checkoutLoading || !customerBillingLive}>
                {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Pro
              </Button>
            )}
            <Button variant="outline" onClick={() => void refreshSummary()} disabled={syncing}>
              {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh status
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t">
        <header className="border-b bg-surface-raised px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Plan capabilities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Free includes the core setup tools with smaller limits. Pro raises those limits for teams.
          </p>
        </header>
        <div className="grid p-5 sm:p-6 md:grid-cols-2 md:divide-x">
          <div className="pb-4 text-sm md:pb-0 md:pr-6">
            <p className="font-medium">Included now</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>REST API: {summary.entitlements.apiAccess ? 'Available' : 'Not included'}</li>
              <li>Public boards: {summary.entitlements.publicBoards ? 'Available' : 'Not included'}</li>
              <li>Webhooks: {summary.entitlements.webhooks ? webhookEndpointText : 'Not included'}</li>
              <li>Webhook logs: {summary.entitlements.webhooks ? webhookHistoryText : 'Not included'}</li>
              <li>MCP / AI agent API: {summary.entitlements.mcp ? 'Available' : 'Not included'}</li>
              <li>Custom branding: {summary.entitlements.customBranding ? 'Available' : 'Upgrade to Pro'}</li>
            </ul>
          </div>
          <div className="border-t pt-4 text-sm md:border-t-0 md:pl-6 md:pt-0">
            <p className="font-medium">Subscription help</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>Manage payment method, invoices, and cancellation from the billing portal.</li>
              <li>Downgrades preserve data; Free limits visible history and higher quotas.</li>
              <li>If a recent payment is missing, refresh status or contact support.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

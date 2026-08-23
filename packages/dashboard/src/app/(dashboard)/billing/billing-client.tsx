'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { BillingSummary } from '@/lib/types'
import { ArrowUpRight, Check, Loader2, ShieldCheck } from 'lucide-react'

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
  const router = useRouter()
  const hasProIntent = searchParams.get('intent') === 'pro'

  const refreshSummary = React.useCallback(async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/billing/sync', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to refresh billing state')
      }
      const next = await response.json()
      setSummary(next)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Failed to refresh billing',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }, [router])

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
  const complimentaryProActive = Boolean(
    summary.account.complimentary_pro_until &&
    new Date(summary.account.complimentary_pro_until).getTime() > Date.now(),
  )
  const paidProActive = summary.account.plan_tier === 'pro' &&
    (summary.account.billing_status === 'active' || summary.account.billing_status === 'trialing')
  const cancellationScheduled = Boolean(
    summary.account.cancel_at_period_end &&
    summary.account.current_period_end &&
    new Date(summary.account.current_period_end).getTime() > Date.now(),
  )
  const cancellationAccessEnd = cancellationScheduled
    ? [summary.account.current_period_end, summary.account.grace_ends_at]
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0]
    : null
  const effectivePro = summary.entitlements.planTier === 'pro'

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <section>
        <header className="border-b bg-surface-raised px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={effectivePro ? 'default' : 'secondary'}>
              {summary.entitlements.label}
            </Badge>
            <Badge variant="outline">{cancellationScheduled ? 'cancels soon' : complimentaryProActive && !paidProActive ? 'referral reward' : summary.account.billing_status}</Badge>
            {!customerBillingLive && <Badge variant="outline">Live checkout unavailable</Badge>}
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">{effectivePro ? 'Your feedback operation is fully unlocked' : hasProIntent ? 'Finish upgrading to Pro' : 'Turn feedback into a shipping system'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {effectivePro ? 'Every project, integration, advanced update control, and branding option stays available.' : 'Pro removes the ceilings when feedback becomes part of how your product team ships.'}
          </p>
          {cancellationScheduled && (
            <div className="mt-4 flex items-start gap-3 border-y border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p><strong>Your data is safe.</strong> Your Pro access remains active through {formatPeriodEnd(cancellationAccessEnd)}. After that, Free limits return and extra projects are frozen, never deleted.</p>
            </div>
          )}
          {!customerBillingLive && !effectivePro && (
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
              ...(paidProActive || cancellationScheduled
                ? [
                    {
                      label: summary.account.cancel_at_period_end ? 'Access until' : 'Next charge',
                      value: formatPeriodEnd(cancellationAccessEnd || summary.account.current_period_end),
                      hint: summary.account.cancel_at_period_end ? 'Cancels after this period' : 'Subscription renewal date',
                    },
                    {
                      label: 'Recurring amount',
                      value: formatMoney(summary.account.recurring_amount, summary.account.billing_currency),
                      hint: formatBillingInterval(summary.account.billing_interval, summary.account.billing_interval_count),
                    },
                  ]
                : complimentaryProActive
                  ? [
                    {
                      label: 'Complimentary access until',
                      value: formatPeriodEnd(summary.account.complimentary_pro_until),
                      hint: 'One-time five-invite reward',
                    },
                  ]
                  : [
                    {
                      label: 'Feedback history',
                      value: 'Full history',
                      hint: 'Free accounts keep and can view every feedback item',
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
            {paidProActive || cancellationScheduled ? (
              <Button onClick={openPortal} disabled={portalLoading || !summary.billingEnabled}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cancellationScheduled ? 'Keep Pro active' : 'Manage billing'}
              </Button>
            ) : complimentaryProActive ? (
              <Button disabled>Referral Pro active</Button>
            ) : (
              <Button onClick={startCheckout} disabled={checkoutLoading || !customerBillingLive}>
                {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Pro, $19/month <ArrowUpRight className="ml-2 h-4 w-4" />
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
          <h2 className="font-semibold">Free is for starting. Pro is for operating.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The core workflow stays useful on Free. Pro removes the limits that interrupt an active product team.
          </p>
        </header>
        <div className="overflow-x-auto p-5 sm:p-6">
          <div className="min-w-[620px] divide-y border-y text-sm">
            <div className="grid grid-cols-[1fr_160px_180px] bg-muted/25 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><span>Capability</span><span>Free</span><span className="text-foreground">Pro, $19/month</span></div>
            {[
              ['Live projects', '2', 'Unlimited'],
              ['Feedback volume', '500 / month', 'Unlimited'],
              ['Feedback history', 'Full history', 'Full history'],
              ['Email alerts and daily digests', 'Not included', 'Included'],
              ['Branding', 'feedbacks.dev attribution', 'Your brand only'],
              ['Webhooks', '1 endpoint, 10 logs', 'Unlimited endpoints and logs'],
              ['Product updates', '3 active, 7-day analytics', 'Unlimited, scheduling, 90-day analytics'],
              ['API, MCP, and public boards', 'Included', 'Included'],
            ].map(([feature, free, pro]) => (
              <div key={feature} className="grid grid-cols-[1fr_160px_180px] items-center px-4 py-3">
                <span className="font-medium">{feature}</span>
                <span className="text-muted-foreground">{free}</span>
                <span className="flex items-center gap-2 font-medium"><Check className="h-4 w-4 text-primary" />{pro}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Cancel any time in the billing portal. You keep Pro through the paid period and receive reminders on its final three days. Downgrades preserve all data and freeze only projects above the Free limit.</p>
        </div>
      </section>
    </div>
  )
}

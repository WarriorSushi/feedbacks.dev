'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import type { BillingSummary } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface BillingClientProps {
  initialSummary: BillingSummary
}

function formatPeriodEnd(value: string | null) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BillingClient({ initialSummary }: BillingClientProps) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={summary.account.plan_tier === 'pro' ? 'default' : 'secondary'}>
              {summary.entitlements.label}
            </Badge>
            <Badge variant="outline">{summary.account.billing_status}</Badge>
            {!summary.billingEnabled && <Badge variant="outline">Billing offline</Badge>}
          </div>
          <CardTitle className="mt-3 text-lg">Billing and plan</CardTitle>
          <CardDescription>
            Billing runs through Dodo Payments. Entitlements update from server-side webhook state, not from the browser redirect alone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projects</p>
              <p className="mt-2 text-2xl font-semibold">{projectLimitText}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.entitlements.projectLimit ? 'Free plan limit' : 'Unlimited on Pro'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback this month</p>
              <p className="mt-2 text-2xl font-semibold">{feedbackLimitText}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.entitlements.feedbackMonthlyLimit ? 'Monthly quota' : 'Unlimited on Pro'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current period end</p>
              <p className="mt-2 text-xl font-semibold">{formatPeriodEnd(summary.account.current_period_end)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.entitlements.historyDays ? `${summary.entitlements.historyDays}-day history on Free` : 'Unlimited history on Pro'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {summary.account.plan_tier === 'pro' ? (
              <Button onClick={openPortal} disabled={portalLoading || !summary.billingEnabled}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Billing
              </Button>
            ) : (
              <Button onClick={startCheckout} disabled={checkoutLoading || !summary.billingEnabled}>
                {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade to Pro
              </Button>
            )}
            <Button variant="outline" onClick={() => void refreshSummary()} disabled={syncing}>
              {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh status
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entitlements</CardTitle>
          <CardDescription>
            One plan matrix should drive marketing copy, gating, and the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium">Included now</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>REST API: {summary.entitlements.apiAccess ? 'Yes' : 'No'}</li>
              <li>Public boards: {summary.entitlements.publicBoards ? 'Yes' : 'No'}</li>
              <li>Webhooks: {summary.entitlements.webhooks ? 'Yes' : 'No'}</li>
              <li>MCP / AI agent API: {summary.entitlements.mcp ? 'Yes' : 'No'}</li>
              <li>Custom branding: {summary.entitlements.customBranding ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium">Operational notes</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>Checkout returns here, but plan changes only after verified webhook processing.</li>
              <li>Downgrades preserve data; Free just gates older history and higher quotas.</li>
              <li>If billing looks stale after checkout, use “Refresh status” after a minute.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

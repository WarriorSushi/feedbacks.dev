'use client'

import * as React from 'react'
import Link from 'next/link'
import type {
  BillingSummary,
  FeedbackType,
  GitHubEndpoint,
  Project,
  WebhookConfig,
  WebhookEndpoint,
} from '@/lib/types'
import {
  buildGitHubEndpointUrl,
  createGitHubEndpoint,
  createWebhookEndpoint,
  listWebhookEndpointStates,
  normalizeWebhookConfig,
  type EndpointHealthStatus,
  type WebhookDeliveryLog,
  type WebhookEndpointState,
  type WebhookKind,
} from '@/lib/webhook-config'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import {
  BellRing,
  Github,
  Loader2,
  Mail,
  MessageSquareMore,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Webhook,
} from 'lucide-react'

interface IntegrationsTabProps {
  project: Project
  initialBillingSummary: BillingSummary | null
}

const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const HEALTH_LABELS: Record<EndpointHealthStatus, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  failing: 'Failing',
  disabled: 'Disabled',
  idle: 'No deliveries yet',
}

function webhooksLockReason(summary: BillingSummary | null) {
  return summary
    ? `Your ${summary.entitlements.label} plan does not include this feature.`
    : 'Upgrade to Pro to use webhook routing, logs, and replay.'
}

const SECTION_META: Array<{
  kind: WebhookKind
  title: string
  description: string
  icon: typeof MessageSquareMore
  placeholder: string
}> = [
  {
    kind: 'slack',
    title: 'Slack',
    description: 'Send new feedback into a Slack channel with one or more incoming webhooks.',
    icon: MessageSquareMore,
    placeholder: 'https://hooks.slack.com/services/...',
  },
  {
    kind: 'discord',
    title: 'Discord',
    description: 'Route project feedback to Discord when that is where your team already works.',
    icon: MessageSquareMore,
    placeholder: 'https://discord.com/api/webhooks/...',
  },
  {
    kind: 'generic',
    title: 'Generic Webhook',
    description: 'Fan feedback into your own workflow, automation layer, or internal service.',
    icon: Webhook,
    placeholder: 'https://example.com/webhooks/feedback',
  },
  {
    kind: 'github',
    title: 'GitHub Issues',
    description: 'Open issues directly in a GitHub repository when feedback matches your rules.',
    icon: Github,
    placeholder: 'owner/repo',
  },
]

function endpointKey(kind: WebhookKind, endpoint: WebhookEndpoint | GitHubEndpoint) {
  return `${kind}:${endpoint.url || endpoint.id}`
}

function formatTimestamp(value: string | null) {
  if (!value) return 'No deliveries yet'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getEndpoints(config: WebhookConfig, kind: WebhookKind): Array<WebhookEndpoint | GitHubEndpoint> {
  if (kind === 'github') return config.github?.endpoints || []
  return config[kind]?.endpoints || []
}

function setEndpoints(
  config: WebhookConfig,
  kind: WebhookKind,
  endpoints: Array<WebhookEndpoint | GitHubEndpoint>,
): WebhookConfig {
  const next: WebhookConfig = { ...config }

  if (kind === 'github') {
    if (endpoints.length === 0) {
      delete next.github
    } else {
      next.github = { endpoints: endpoints as GitHubEndpoint[] }
    }
    return next
  }

  if (endpoints.length === 0) {
    delete next[kind]
  } else {
    next[kind] = { endpoints: endpoints as WebhookEndpoint[] }
  }

  return next
}

function EndpointRulesEditor({
  endpoint,
  onChange,
}: {
  endpoint: WebhookEndpoint | GitHubEndpoint
  onChange: (next: WebhookEndpoint | GitHubEndpoint) => void
}) {
  const rules = endpoint.rules || {}

  const toggleType = (type: FeedbackType) => {
    const nextTypes = rules.types?.includes(type)
      ? (rules.types || []).filter((entry) => entry !== type)
      : [...(rules.types || []), type]
    onChange({
      ...endpoint,
      rules: {
        ...rules,
        types: nextTypes.length > 0 ? nextTypes : undefined,
      },
    })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Payload format</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={endpoint.format || 'full'}
            onChange={(e) => onChange({ ...endpoint, format: e.target.value as 'compact' | 'full' })}
          >
            <option value="full">Full payload</option>
            <option value="compact">Compact payload</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Max rating</label>
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="Any"
            value={endpoint.rules?.ratingMax ?? ''}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : undefined
              onChange({
                ...endpoint,
                rules: {
                  ...rules,
                  ratingMax: value,
                },
              })
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Tags must include</label>
          <Input
            placeholder="billing, auth"
            value={endpoint.rules?.tagsInclude?.join(', ') || ''}
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)
              onChange({
                ...endpoint,
                rules: {
                  ...rules,
                  tagsInclude: tags.length > 0 ? tags : undefined,
                },
              })
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Only send these feedback types</label>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map((type) => (
            <label key={type} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <input
                type="checkbox"
                checked={rules.types?.includes(type) || false}
                onChange={() => toggleType(type)}
                className="h-3.5 w-3.5 rounded border"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeliveryLogList({
  deliveries,
  resendingId,
  onResend,
}: {
  deliveries: WebhookDeliveryLog[]
  resendingId: string | null
  onResend: (deliveryId: string) => void
}) {
  if (deliveries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
        Deliveries will appear here after a live feedback event or a manual test send.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <div
          key={delivery.id}
          data-delivery-id={delivery.id}
          data-delivery-kind={delivery.kind}
          className="rounded-lg border p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={delivery.status === 'success' ? 'secondary' : 'destructive'}>
                  {delivery.status === 'success' ? 'Delivered' : 'Failed'}
                </Badge>
                <Badge variant="outline" className="uppercase">{delivery.kind}</Badge>
                <span className="text-xs text-muted-foreground">{delivery.event}</span>
              </div>
              <p className="break-all text-sm font-medium">{delivery.url}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimestamp(delivery.created_at)}
                {delivery.status_code ? ` · HTTP ${delivery.status_code}` : ''}
                {delivery.attempt ? ` · ${delivery.attempt} attempt${delivery.attempt === 1 ? '' : 's'}` : ''}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onResend(delivery.id)}
              disabled={resendingId === delivery.id}
            >
              {resendingId === delivery.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Resend
            </Button>
          </div>

          {delivery.response_body && (
            <div className="mt-3 rounded-md bg-muted/20 p-3 text-xs text-muted-foreground">
              {delivery.response_body.slice(0, 240)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function IntegrationsTab({ project, initialBillingSummary }: IntegrationsTabProps) {
  const [config, setConfig] = React.useState<WebhookConfig>(() => normalizeWebhookConfig(project.webhooks))
  const [deliveries, setDeliveries] = React.useState<WebhookDeliveryLog[]>([])
  const [health, setHealth] = React.useState<WebhookEndpointState[]>(() =>
    listWebhookEndpointStates(normalizeWebhookConfig(project.webhooks)),
  )
  const [billingSummary, setBillingSummary] = React.useState<BillingSummary | null>(initialBillingSummary)
  const [loadingOps, setLoadingOps] = React.useState(initialBillingSummary?.entitlements.webhooks !== false)
  const [saving, setSaving] = React.useState(false)
  const [testingKey, setTestingKey] = React.useState<string | null>(null)
  const [resendingId, setResendingId] = React.useState<string | null>(null)
  const [featureLocked, setFeatureLocked] = React.useState(initialBillingSummary?.entitlements.webhooks === false)
  const [lockReason, setLockReason] = React.useState(() => webhooksLockReason(initialBillingSummary))

  React.useEffect(() => {
    if (billingSummary) return

    const loadBilling = async () => {
      try {
        const response = await fetch('/api/billing/sync', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        setBillingSummary(data)
      } catch {
        // Keep integrations usable even if billing summary is temporarily unavailable.
      }
    }

    void loadBilling()
  }, [billingSummary])

  const handleLockedResponse = React.useCallback(async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => ({ error: fallback }))
    const message = payload.error || fallback

    if (response.status === 403 && payload.code === 'feature_not_in_plan') {
      setFeatureLocked(true)
      setLockReason(message)
      return { locked: true as const, message }
    }

    throw new Error(message)
  }, [])

  const loadOperations = React.useCallback(async () => {
    setLoadingOps(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/webhooks/deliveries`, { cache: 'no-store' })
      if (!response.ok) {
        const locked = await handleLockedResponse(response, 'Failed to load delivery history')
        if (locked.locked) {
          setDeliveries([])
          setHealth([])
          return
        }
      }
      const data = await response.json()
      setFeatureLocked(false)
      setDeliveries(data.deliveries || [])
      setHealth(data.health || [])
    } catch (error) {
      toast({
        title: 'Failed to load delivery logs',
        description: error instanceof Error ? error.message : 'Failed to load webhook delivery history',
        variant: 'destructive',
      })
    } finally {
      setLoadingOps(false)
    }
  }, [handleLockedResponse, project.id])

  React.useEffect(() => {
    if (!billingSummary) return

    if (!billingSummary.entitlements.webhooks) {
      setFeatureLocked(true)
      setLockReason(webhooksLockReason(billingSummary))
      setDeliveries([])
      setHealth([])
      setLoadingOps(false)
      return
    }

    void loadOperations()
  }, [billingSummary, loadOperations])

  const endpointHealth = React.useMemo(() => {
    return new Map(health.map((state) => [endpointKey(state.kind, state.endpoint), state]))
  }, [health])

  const updateEndpoint = (
    kind: WebhookKind,
    index: number,
    nextEndpoint: WebhookEndpoint | GitHubEndpoint,
  ) => {
    setConfig((prev) => {
      const endpoints = [...getEndpoints(prev, kind)]
      endpoints[index] = nextEndpoint
      return setEndpoints(prev, kind, endpoints)
    })
  }

  const addEndpoint = (kind: WebhookKind) => {
    setConfig((prev) => {
      const endpoints = [...getEndpoints(prev, kind)]
      endpoints.push(kind === 'github' ? createGitHubEndpoint() : createWebhookEndpoint(kind))
      return setEndpoints(prev, kind, endpoints)
    })
  }

  const removeEndpoint = (kind: WebhookKind, index: number) => {
    setConfig((prev) => {
      const endpoints = [...getEndpoints(prev, kind)]
      endpoints.splice(index, 1)
      return setEndpoints(prev, kind, endpoints)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/webhooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const locked = await handleLockedResponse(response, 'Failed to save integrations')
        if (locked.locked) {
          toast({
            title: 'Webhooks are on Pro',
            description: locked.message,
          })
          return
        }
      }

      const next = normalizeWebhookConfig(await response.json())
      setFeatureLocked(false)
      setConfig(next)
      toast({ title: 'Integrations saved' })
      await loadOperations()
    } catch (error) {
      toast({
        title: 'Failed to save integrations',
        description: error instanceof Error ? error.message : 'Failed to save integrations',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (kind: WebhookKind, endpoint: WebhookEndpoint | GitHubEndpoint) => {
    const key = endpointKey(kind, endpoint)
    setTestingKey(key)

    try {
      const response = await fetch(`/api/projects/${project.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, endpoint }),
      })

      if (!response.ok) {
        const locked = await handleLockedResponse(response, 'Failed to send test')
        if (locked.locked) {
          toast({
            title: 'Webhooks are on Pro',
            description: locked.message,
          })
          return
        }
      }

      setFeatureLocked(false)
      toast({ title: 'Test sent', description: 'Check the delivery log below for the result.' })
      await loadOperations()
    } catch (error) {
      toast({
        title: 'Test failed',
        description: error instanceof Error ? error.message : 'Failed to send test webhook',
        variant: 'destructive',
      })
    } finally {
      setTestingKey(null)
    }
  }

  const handleResend = async (deliveryId: string) => {
    setResendingId(deliveryId)
    try {
      const response = await fetch(`/api/projects/${project.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', deliveryId }),
      })

      if (!response.ok) {
        const locked = await handleLockedResponse(response, 'Failed to resend delivery')
        if (locked.locked) {
          toast({
            title: 'Webhooks are on Pro',
            description: locked.message,
          })
          return
        }
      }

      setFeatureLocked(false)
      toast({ title: 'Delivery replayed' })
      await loadOperations()
    } catch (error) {
      toast({
        title: 'Resend failed',
        description: error instanceof Error ? error.message : 'Failed to replay delivery',
        variant: 'destructive',
      })
    } finally {
      setResendingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Workflow routing</Badge>
            <Badge variant="outline">Operational logs</Badge>
            <Badge variant="outline">Rules and health</Badge>
            {billingSummary?.entitlements.label === 'Free' && (
              <Badge variant="outline">Pro feature</Badge>
            )}
          </div>
          <CardTitle className="mt-3 text-lg">Route important feedback where your team already works</CardTitle>
          <CardDescription>
            Slack, Discord, GitHub, and generic webhooks share one canonical backend path now. This screen stays honest about what is real today: immediate delivery, test sends, recent logs, replay, and per-endpoint routing rules.
          </CardDescription>
        </CardHeader>
      </Card>

      {featureLocked && (
        <Card className="border-primary/30 bg-primary/[0.04]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">Upgrade required</Badge>
              <Badge variant="outline">Webhook routing</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Unlock delivery logs, replay, and live routing with Pro</CardTitle>
            <CardDescription>
              {lockReason}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/billing">
              <Button>Open Billing</Button>
            </Link>
            <Link href={`/projects/${project.id}?tab=install`}>
              <Button variant="outline">Back to install</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!featureLocked && SECTION_META.map((section) => {
        const endpoints = getEndpoints(config, section.kind)
        const Icon = section.icon

        return (
          <Card key={section.kind} data-webhook-kind={section.kind}>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </div>
                <CardDescription className="mt-1">{section.description}</CardDescription>
              </div>

              <Button variant="outline" size="sm" onClick={() => addEndpoint(section.kind)}>
                <Plus className="mr-2 h-4 w-4" />
                Add endpoint
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {endpoints.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                  No {section.title.toLowerCase()} endpoints yet.
                </div>
              ) : (
                endpoints.map((endpoint, index) => {
                  const state = endpointHealth.get(endpointKey(section.kind, endpoint))
                  const isGitHub = section.kind === 'github'

                  return (
                    <div key={endpoint.id} className="space-y-4 rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Endpoint {index + 1}</Badge>
                          <Badge
                            variant={state?.health === 'healthy' ? 'secondary' : state?.health === 'idle' ? 'outline' : 'destructive'}
                          >
                            {HEALTH_LABELS[state?.health || 'idle']}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(state?.lastDeliveryAt || null)}
                          </span>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={endpoint.enabled}
                            onChange={(e) => updateEndpoint(section.kind, index, { ...endpoint, enabled: e.target.checked })}
                            className="h-4 w-4 rounded border"
                          />
                          Enabled
                        </label>
                      </div>

                      {isGitHub ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Repository</label>
                            <Input
                              placeholder={section.placeholder}
                              value={(endpoint as GitHubEndpoint).repo}
                              onChange={(e) => {
                                const repo = e.target.value
                                updateEndpoint(section.kind, index, {
                                  ...(endpoint as GitHubEndpoint),
                                  repo,
                                  url: repo ? buildGitHubEndpointUrl(repo) : '',
                                })
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Token</label>
                            <Input
                              type="password"
                              placeholder="github_pat_..."
                              value={(endpoint as GitHubEndpoint).token}
                              onChange={(e) =>
                                updateEndpoint(section.kind, index, {
                                  ...(endpoint as GitHubEndpoint),
                                  token: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Labels</label>
                            <Input
                              placeholder="feedback, triage"
                              value={(endpoint as GitHubEndpoint).labels || ''}
                              onChange={(e) =>
                                updateEndpoint(section.kind, index, {
                                  ...(endpoint as GitHubEndpoint),
                                  labels: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Issue API URL</label>
                            <Input value={endpoint.url} readOnly className="text-xs text-muted-foreground" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Webhook URL</label>
                          <Input
                            placeholder={section.placeholder}
                            value={endpoint.url}
                            onChange={(e) =>
                              updateEndpoint(section.kind, index, {
                                ...endpoint,
                                url: e.target.value,
                              })
                            }
                          />
                        </div>
                      )}

                      <EndpointRulesEditor
                        endpoint={endpoint}
                        onChange={(nextEndpoint) => updateEndpoint(section.kind, index, nextEndpoint)}
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(section.kind, endpoint)}
                          disabled={testingKey === endpointKey(section.kind, endpoint)}
                        >
                          {testingKey === endpointKey(section.kind, endpoint) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                          )}
                          Send test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeEndpoint(section.kind, index)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        )
      })}

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Email Notifications</CardTitle>
            <Badge variant="secondary">Live in Settings</Badge>
          </div>
          <CardDescription>
            Account-level email alerts are live in Settings for new feedback and webhook failures. This screen stays focused on routing destinations instead of pretending per-project email fan-out already exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="rounded-b-xl bg-muted/10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Email alerts are managed from your account settings, while Slack or a generic webhook is still the clearest project-routing path.
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">Manage email alerts</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {!featureLocked && (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-base">Recent delivery history</CardTitle>
                <CardDescription>
                  Recent test and live deliveries, including failed attempts you can replay.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadOperations()} disabled={loadingOps}>
                {loadingOps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh logs
              </Button>
            </CardHeader>
            <CardContent>
              <DeliveryLogList deliveries={deliveries} resendingId={resendingId} onResend={handleResend} />
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Integrations
          </Button>
        </>
      )}
    </div>
  )
}

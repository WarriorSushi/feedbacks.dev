'use client'

import * as React from 'react'
import Link from 'next/link'
import type {
  BillingSummary,
  GitHubEndpoint,
  Project,
  WebhookConfig,
  WebhookEndpoint,
} from '@/lib/types'
import {
  buildGitHubEndpointUrl,
  countActiveWebhookEndpoints,
  createGitHubEndpoint,
  createWebhookEndpoint,
  listWebhookEndpointStates,
  normalizeWebhookConfig,
  type EndpointHealthStatus,
  type WebhookDeliveryLog,
  type WebhookEndpointState,
  type WebhookKind,
} from '@/lib/webhook-config'
import type { EmailDeliveryLog } from '@/lib/delivery-history'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/ui/workspace-shell'
import { FormErrorSummary } from '@/components/ui/field-error'
import {
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
import { IntegrationDeliveryHistory, IntegrationEndpointRulesEditor } from './integration-operations-ui'

interface IntegrationsTabProps {
  project: Project
  initialBillingSummary: BillingSummary | null
}

const HEALTH_LABELS: Record<EndpointHealthStatus, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  failing: 'Failing',
  disabled: 'Disabled',
  idle: 'No deliveries yet',
}

function webhooksLockReason(summary: BillingSummary | null) {
  return summary
    ? `Webhook routing is not available on your current ${summary.entitlements.label} plan.`
    : 'Webhook routing, logs, and replay are temporarily unavailable.'
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
  return `${kind}:${endpoint.id}`
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

export function IntegrationsTab({ project, initialBillingSummary }: IntegrationsTabProps) {
  const initialConfig = React.useMemo(() => normalizeWebhookConfig(project.webhooks), [project.webhooks])
  const [config, setConfig] = React.useState<WebhookConfig>(initialConfig)
  const [savedConfig, setSavedConfig] = React.useState<WebhookConfig>(initialConfig)
  const [deliveries, setDeliveries] = React.useState<WebhookDeliveryLog[]>([])
  const [emailDeliveries, setEmailDeliveries] = React.useState<EmailDeliveryLog[]>([])
  const [health, setHealth] = React.useState<WebhookEndpointState[]>(() =>
    listWebhookEndpointStates(normalizeWebhookConfig(project.webhooks)),
  )
  const [billingSummary, setBillingSummary] = React.useState<BillingSummary | null>(initialBillingSummary)
  const [loadingOps, setLoadingOps] = React.useState(initialBillingSummary?.entitlements.webhooks !== false)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')
  const [testingKey, setTestingKey] = React.useState<string | null>(null)
  const [resendingId, setResendingId] = React.useState<string | null>(null)
  const [featureLocked, setFeatureLocked] = React.useState(initialBillingSummary?.entitlements.webhooks === false)
  const [lockReason, setLockReason] = React.useState(() => webhooksLockReason(initialBillingSummary))
  const endpointLimit = billingSummary?.entitlements.webhookEndpointLimit ?? null
  const activeEndpointCount = React.useMemo(() => countActiveWebhookEndpoints(config), [config])
  const endpointLimitReached = endpointLimit !== null && activeEndpointCount >= endpointLimit
  const isDirty = React.useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  )

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
          setEmailDeliveries([])
          setHealth([])
          return
        }
      }
      const data = await response.json()
      setFeatureLocked(false)
      setDeliveries(data.deliveries || [])
      setEmailDeliveries(data.emailDeliveries || [])
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
      setEmailDeliveries([])
      setHealth([])
      setLoadingOps(false)
      return
    }

    void loadOperations()
  }, [billingSummary, loadOperations])

  React.useEffect(() => {
    if (featureLocked) return
    const loadConfig = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/webhooks`, { cache: 'no-store' })
        if (!response.ok) return
        const next = normalizeWebhookConfig(await response.json())
        setConfig(next)
        setSavedConfig(next)
      } catch {
        // The initial server-rendered safe config remains usable when refresh fails.
      }
    }
    void loadConfig()
  }, [featureLocked, project.id])

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
    setSaveError('')
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
      setSavedConfig(next)
      toast({ title: 'Integrations saved' })
      await loadOperations()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Integrations could not be saved. Check the endpoint details and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (kind: WebhookKind, endpoint: WebhookEndpoint | GitHubEndpoint) => {
    if (isDirty) {
      toast({
        title: 'Save changes before testing',
        description: 'The test uses the encrypted configuration currently stored on the server.',
      })
      return
    }
    const hasUnsavedCredential = !endpoint.secretStored
      || (kind === 'github' && Boolean((endpoint as GitHubEndpoint).token))
      || (kind !== 'github' && Boolean(endpoint.url))
      || (kind === 'generic' && Boolean(endpoint.signingSecret))
    if (hasUnsavedCredential) {
      toast({
        title: 'Save this endpoint first',
        description: 'Credentials are encrypted when you save. You can send a test immediately after.',
      })
      return
    }

    const key = endpointKey(kind, endpoint)
    setTestingKey(key)

    try {
      const response = await fetch(`/api/projects/${project.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: kind, endpointId: endpoint.id }),
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
    <div className="space-y-4" data-tour="integration-workspace">
      <PageHeader
        eyebrow={project.name}
        title="Integrations"
        description="Send important feedback to Slack, Discord, GitHub, or your own webhook."
      />

      {!featureLocked && billingSummary && (
        <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {endpointLimit === null
                  ? 'Unlimited active endpoints on Pro'
                  : `${activeEndpointCount} of ${endpointLimit} active endpoint${endpointLimit === 1 ? '' : 's'} used on Free`}
              </p>
            </div>
            {billingSummary.entitlements.label === 'Free' && (
              <Link href="/billing">
                <Button variant="outline" size="sm">View Pro limits</Button>
              </Link>
            )}
        </div>
      )}

      {featureLocked && (
        <Card className="border-primary/30 bg-primary/[0.04]">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">Plan limit</Badge>
              <Badge variant="outline">Webhook routing</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Webhook routing is not available for this account</CardTitle>
            <CardDescription>
              {lockReason}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/billing">
              <Button>Open Billing</Button>
            </Link>
            <Link href={`/projects/${project.id}?tab=install`}>
              <Button variant="outline">Back to setup</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!featureLocked && SECTION_META.map((section) => {
        const endpoints = getEndpoints(config, section.kind)
        const Icon = section.icon

        return (
          <details key={section.kind} data-webhook-kind={section.kind} data-tour="integration-endpoint" className="group overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
            <summary className="flex cursor-pointer list-none flex-col gap-3 bg-surface-raised/55 px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <span className="text-xs text-muted-foreground">{endpoints.length > 0 ? `${endpoints.length} configured` : 'Not connected'}</span>
                </div>
                <CardDescription className="mt-1">{section.description}</CardDescription>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  event.currentTarget.closest('details')?.setAttribute('open', '')
                  addEndpoint(section.kind)
                }}
                disabled={endpointLimitReached}
                title={endpointLimitReached ? 'Free includes one active endpoint. Disable another endpoint or upgrade.' : undefined}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add {section.title} endpoint
              </Button>
            </summary>

            <div className="space-y-4 border-t p-5">
              {endpoints.length === 0 ? (
                <div className="border-y border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
                  No {section.title.toLowerCase()} endpoint yet. Add one when you are ready to send feedback there.
                </div>
              ) : (
                endpoints.map((endpoint, index) => {
                  const state = endpointHealth.get(endpointKey(section.kind, endpoint))
                  const isGitHub = section.kind === 'github'

                  return (
                    <div key={endpoint.id} className="space-y-4 border-y bg-muted/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Endpoint {index + 1}</Badge>
                          <Badge
                            variant={!endpoint.enabled || state?.health === 'idle' ? 'outline' : state?.health === 'healthy' ? 'secondary' : 'destructive'}
                          >
                            {!endpoint.enabled ? 'Disabled' : HEALTH_LABELS[state?.health || 'idle']}
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
                              aria-label={`Repository for ${section.title} endpoint ${index + 1}`}
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
                              aria-label={`Token for ${section.title} endpoint ${index + 1}`}
                              type="password"
                              placeholder={(endpoint as GitHubEndpoint).secretStored ? 'Stored securely ••••••••' : 'github_pat_...'}
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
                              aria-label={`Labels for ${section.title} endpoint ${index + 1}`}
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
                            <Input aria-label={`Issue API URL for ${section.title} endpoint ${index + 1}`} value={endpoint.url} readOnly className="text-xs text-muted-foreground" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Webhook URL</label>
                            <Input
                              aria-label={`Webhook URL for ${section.title} endpoint ${index + 1}`}
                              placeholder={section.placeholder}
                              value={endpoint.url}
                              onChange={(e) =>
                                updateEndpoint(section.kind, index, {
                                  ...endpoint,
                                  url: e.target.value,
                                })
                              }
                            />
                            {endpoint.secretStored && !endpoint.url && (
                              <p className="text-xs text-muted-foreground">
                                Stored securely for {endpoint.destinationHint || section.title}. Enter a new URL only to replace it.
                              </p>
                            )}
                          </div>

                          {section.kind === 'generic' && (
                            <div className="border-y bg-background/60 p-3">
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_1.2fr] md:items-start">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Signing secret
                                  </label>
                                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    Optional. Adds timestamp and HMAC headers so your receiver can reject forged or stale deliveries.
                                  </p>
                                </div>
                                <Input
                                  aria-label={`Signing secret for ${section.title} endpoint ${index + 1}`}
                                  type="password"
                                  placeholder={endpoint.secretStored ? 'Stored securely (optional)' : 'whsec_...'}
                                  value={endpoint.signingSecret || ''}
                                  onChange={(e) =>
                                    updateEndpoint(section.kind, index, {
                                      ...endpoint,
                                      signingSecret: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <IntegrationEndpointRulesEditor
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
            </div>
          </details>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-surface-raised/35 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Personal email alerts are managed in account settings.
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm">Manage email alerts</Button>
            </Link>
      </div>

      {!featureLocked && (
        <>
          <Card className="overflow-hidden rounded-lg shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-col gap-3 border-b bg-surface-raised/55 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-base">Recent delivery history</CardTitle>
                <CardDescription>
                  Email activity for your account and webhook deliveries for this project. Failed webhooks can be replayed.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadOperations()} disabled={loadingOps}>
                {loadingOps ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh logs
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <IntegrationDeliveryHistory
                deliveries={deliveries}
                emailDeliveries={emailDeliveries}
                resendingId={resendingId}
                onResend={handleResend}
              />
            </CardContent>
          </Card>

          {isDirty && (
            <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-20 rounded-lg border bg-background/95 p-3 shadow-xl backdrop-blur">
              <FormErrorSummary className="mb-3">{saveError}</FormErrorSummary>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">You have unsaved integration changes.</p>
                <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => { setConfig(savedConfig); setSaveError('') }}
                >
                  Discard
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save integrations
                </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

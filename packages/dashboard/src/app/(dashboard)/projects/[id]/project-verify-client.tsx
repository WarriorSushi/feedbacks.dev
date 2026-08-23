'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildRuntimeWidgetConfig,
  getWidgetLauncherPositionLabel,
  getWidgetModeLabel,
  HOSTED_VERIFICATION_SUBMISSION_CONTEXT,
  type SavedWidgetConfig,
} from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  Palette,
  RefreshCw,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { WidgetPreviewSurface } from './widget-preview-surface'
import { SetupProgress } from './project-flow-nav'
import { PageHeader } from '@/components/ui/workspace-shell'

interface ProjectVerifyClientProps {
  appOrigin: string
  projectId: string
  projectKey: string
  projectName: string
  projectDomain: string | null
  savedConfig: SavedWidgetConfig
}

type EmbedStatus = {
  state: 'loading' | 'not_detected' | 'connected' | 'stale' | 'error'
  lastSeenAt: string | null
  runtimeVersion: string | null
}

type VerifiedFeedback = {
  id: string
  url: string | null
}

const EMBED_RETRY_INTERVAL_MS = 15_000
const EMBED_AUTO_STOP_MS = 5 * 60_000
const VERIFICATION_FAST_WINDOW_MS = 45_000
const VERIFICATION_FAST_INTERVAL_MS = 4_000
const VERIFICATION_IDLE_INTERVAL_MS = 30_000
const VERIFICATION_AUTO_STOP_MS = 10 * 60_000

export function ProjectVerifyClient({
  appOrigin,
  projectId,
  projectKey,
  projectName,
  projectDomain,
  savedConfig,
}: ProjectVerifyClientProps) {
  const [hostedPreviewStatus, setHostedPreviewStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [hostedPreviewError, setHostedPreviewError] = React.useState<string | null>(null)
  const [hostedPreviewOpen, setHostedPreviewOpen] = React.useState(false)
  const [hostedFeedbackId, setHostedFeedbackId] = React.useState<string | null>(null)
  const [verifiedFeedback, setVerifiedFeedback] = React.useState<VerifiedFeedback | null>(null)
  const [verificationStartedAt, setVerificationStartedAt] = React.useState<string | null>(null)
  const [verificationAutoCheckExpired, setVerificationAutoCheckExpired] = React.useState(false)
  const [checkingFeedback, setCheckingFeedback] = React.useState(false)
  const [feedbackCheckError, setFeedbackCheckError] = React.useState(false)
  const [embedStatus, setEmbedStatus] = React.useState<EmbedStatus>({
    state: 'loading',
    lastSeenAt: null,
    runtimeVersion: null,
  })
  const [diagnosticCopyState, setDiagnosticCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle')
  const activatedFeedbackIds = React.useRef(new Set<string>())
  const embedCheckInFlight = React.useRef(false)
  const feedbackCheckInFlight = React.useRef(false)

  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey, savedConfig, { appOrigin }),
    [appOrigin, projectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const projectUrl = projectDomain ? `https://${projectDomain}` : null
  const launcherPosition = getWidgetLauncherPositionLabel(runtimeConfig.position)
  const embedConnected = embedStatus.state === 'connected'
  const realSiteInstruction = runtimeConfig.embedMode === 'inline'
    ? 'Open the page where you installed the form, fill it out, and send one test.'
    : runtimeConfig.embedMode === 'trigger'
      ? 'Open your product, click your own feedback button, and send one test.'
      : `Open your product, click the "${runtimeConfig.buttonText || 'Feedback'}" button in the ${launcherPosition}, and send one test.`
  const hostedInstruction = runtimeConfig.embedMode === 'inline'
    ? 'The saved form appears inside the preview below. Fill it out and send one control test.'
    : runtimeConfig.embedMode === 'trigger'
      ? 'Click the test trigger inside the preview below, then send one control test.'
      : `Click the "${runtimeConfig.buttonText || 'Feedback'}" button fixed to the ${launcherPosition} of this page.`

  const checkEmbed = React.useCallback(async () => {
    if (embedCheckInFlight.current) return
    embedCheckInFlight.current = true
    try {
      const response = await fetch(`/api/projects/${projectId}/embed-status`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error('Status unavailable')
      setEmbedStatus({
        state: payload.state,
        lastSeenAt: payload.lastSeenAt || null,
        runtimeVersion: payload.runtimeVersion || null,
      })
    } catch {
      setEmbedStatus((current) => ({ ...current, state: 'error' }))
    } finally {
      embedCheckInFlight.current = false
    }
  }, [projectId])

  const markProductVerification = React.useCallback((feedback: VerifiedFeedback) => {
    setVerifiedFeedback(feedback)
    if (activatedFeedbackIds.current.has(feedback.id)) return
    activatedFeedbackIds.current.add(feedback.id)
    void fetch(`/api/projects/${projectId}/activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'verification_completed' }),
    })
  }, [projectId])

  const checkForProductFeedback = React.useCallback(async () => {
    if (!verificationStartedAt || verifiedFeedback || feedbackCheckInFlight.current) return
    feedbackCheckInFlight.current = true
    setCheckingFeedback(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/verification-status?since=${encodeURIComponent(verificationStartedAt)}`,
        { cache: 'no-store' },
      )
      const payload = await response.json()
      if (!response.ok) throw new Error('Verification status unavailable')
      setFeedbackCheckError(false)
      const feedback = payload.feedback as VerifiedFeedback | null
      if (feedback?.id) {
        markProductVerification(feedback)
      }
    } catch {
      setFeedbackCheckError(true)
    } finally {
      feedbackCheckInFlight.current = false
      setCheckingFeedback(false)
    }
  }, [markProductVerification, projectId, verificationStartedAt, verifiedFeedback])

  React.useEffect(() => {
    setVerificationStartedAt(new Date().toISOString())
    setVerificationAutoCheckExpired(false)
  }, [projectId])

  React.useEffect(() => {
    if (embedConnected) return

    let cancelled = false
    let timeout: number | undefined
    let running = false
    const pollingStartedAt = Date.now()

    const schedule = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      if (Date.now() - pollingStartedAt >= EMBED_AUTO_STOP_MS) return
      timeout = window.setTimeout(() => void run(), EMBED_RETRY_INTERVAL_MS)
    }

    const run = async () => {
      if (cancelled || running || document.visibilityState !== 'visible') return
      running = true
      await checkEmbed()
      running = false
      schedule()
    }

    const resumeWhenVisible = () => {
      if (document.visibilityState !== 'visible') {
        if (timeout !== undefined) window.clearTimeout(timeout)
        timeout = undefined
        return
      }
      if (timeout !== undefined) window.clearTimeout(timeout)
      timeout = undefined
      void run()
    }

    void run()
    document.addEventListener('visibilitychange', resumeWhenVisible)
    window.addEventListener('focus', resumeWhenVisible)
    return () => {
      cancelled = true
      if (timeout !== undefined) window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', resumeWhenVisible)
      window.removeEventListener('focus', resumeWhenVisible)
    }
  }, [checkEmbed, embedConnected])

  React.useEffect(() => {
    if (!verificationStartedAt || verifiedFeedback) return

    let cancelled = false
    let timeout: number | undefined
    let running = false
    const startedAt = new Date(verificationStartedAt).getTime()

    const schedule = () => {
      if (cancelled || document.visibilityState !== 'visible') return
      const elapsed = Date.now() - startedAt
      if (elapsed >= VERIFICATION_AUTO_STOP_MS) {
        setVerificationAutoCheckExpired(true)
        return
      }
      const delay = elapsed < VERIFICATION_FAST_WINDOW_MS
        ? VERIFICATION_FAST_INTERVAL_MS
        : VERIFICATION_IDLE_INTERVAL_MS
      timeout = window.setTimeout(() => void run(), delay)
    }

    const run = async () => {
      if (cancelled || running || document.visibilityState !== 'visible') return
      running = true
      await checkForProductFeedback()
      running = false
      schedule()
    }

    const resumeWhenVisible = () => {
      if (document.visibilityState !== 'visible') {
        if (timeout !== undefined) window.clearTimeout(timeout)
        timeout = undefined
        return
      }
      if (timeout !== undefined) window.clearTimeout(timeout)
      timeout = undefined
      void run()
    }

    void run()
    document.addEventListener('visibilitychange', resumeWhenVisible)
    window.addEventListener('focus', resumeWhenVisible)
    return () => {
      cancelled = true
      if (timeout !== undefined) window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', resumeWhenVisible)
      window.removeEventListener('focus', resumeWhenVisible)
    }
  }, [checkForProductFeedback, verificationStartedAt, verifiedFeedback])

  React.useEffect(() => {
    const handleHostedSubmission = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; submissionContext?: string }>).detail
      if (detail?.id && detail.submissionContext === HOSTED_VERIFICATION_SUBMISSION_CONTEXT) {
        setHostedFeedbackId(detail.id)
      }
    }

    window.addEventListener('feedbacks:submitted', handleHostedSubmission)
    return () => window.removeEventListener('feedbacks:submitted', handleHostedSubmission)
  }, [])

  const copyDiagnostics = async () => {
    const packet = [
      'feedbacks.dev install diagnostic',
      `Project: ${projectId}`,
      `Publishable key: ${projectKey}`,
      `Embed state: ${embedStatus.state}`,
      `Last seen: ${embedStatus.lastSeenAt || 'never'}`,
      `Runtime: ${embedStatus.runtimeVersion || 'unknown'}`,
      `Hosted preview: ${hostedPreviewStatus}`,
      `Mode: ${runtimeConfig.embedMode}`,
      `App origin: ${appOrigin}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(packet)
      setDiagnosticCopyState('copied')
    } catch {
      setDiagnosticCopyState('error')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-tour="verify-surface">
      <SetupProgress projectId={projectId} activeStep="verify" />

      <div data-tour="verify-guide">
        <PageHeader
          eyebrow={projectName}
          title="Test it in your product"
          description="Open the product where you installed feedbacks.dev, send one message there, and watch for it to arrive here."
        />
      </div>

      {verifiedFeedback ? (
        <div className="flex flex-col gap-4 rounded-lg border border-primary/35 bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between" role="status">
          <div className="flex min-w-0 gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Test feedback arrived from your product</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The installed embed, saved form, submission endpoint, and inbox path are working together.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild>
              <Link href={`/feedback/${verifiedFeedback.id}`}>
                Open inbox item
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/feedback-form`}>
                <Palette className="mr-2 h-4 w-4" />
                Customize form
              </Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-5 sm:p-7">
            <p className="text-xs font-medium text-primary">Real product test</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Send feedback from where your users will.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              This is the proof that matters. A hosted preview can test the form, but only your product confirms the embed was installed in the right place.
            </p>

            <ol className="mt-6 divide-y rounded-md border bg-surface-soft/60 px-4 text-sm">
              <li className="grid grid-cols-[28px_1fr] gap-3 py-3.5">
                <span className="font-semibold text-primary">1</span>
                <span>Open the website or app where you installed the snippet.</span>
              </li>
              <li className="grid grid-cols-[28px_1fr] gap-3 py-3.5">
                <span className="font-semibold text-primary">2</span>
                <span>{realSiteInstruction}</span>
              </li>
              <li className="grid grid-cols-[28px_1fr] gap-3 py-3.5">
                <span className="font-semibold text-primary">3</span>
                <span>Leave this page open. The new inbox item will be detected automatically.</span>
              </li>
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              {projectUrl ? (
                <Button asChild>
                  <a href={projectUrl} target="_blank" rel="noopener noreferrer">
                    <Globe2 className="mr-2 h-4 w-4" />
                    Open {projectDomain}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
              <Button variant={projectUrl ? 'outline' : 'default'} onClick={() => void checkForProductFeedback()} disabled={checkingFeedback || Boolean(verifiedFeedback)}>
                {checkingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Check inbox now
              </Button>
            </div>
            {!projectUrl ? (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                No project domain is saved, so open your product manually. You can add its domain in Project settings later.
              </p>
            ) : null}
          </div>

          <aside className="border-t bg-surface-inset/55 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-start gap-2.5">
              {embedStatus.state === 'connected'
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {embedStatus.state === 'connected'
                    ? 'Embed detected'
                    : embedStatus.state === 'stale'
                      ? 'Connection is stale'
                      : embedStatus.state === 'loading'
                        ? 'Checking the embed…'
                        : embedStatus.state === 'error'
                          ? 'Connection check failed'
                          : 'Embed not detected yet'}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {embedStatus.lastSeenAt
                    ? `Last seen ${new Date(embedStatus.lastSeenAt).toLocaleString()}${embedStatus.runtimeVersion ? ` · runtime ${embedStatus.runtimeVersion}` : ''}.`
                    : 'Load a deployed page after pasting the snippet, then check again.'}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t pt-5" aria-live="polite">
              {verifiedFeedback ? (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  New feedback received
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {verificationAutoCheckExpired
                    ? <RefreshCw className="h-4 w-4" />
                    : <Loader2 className="h-4 w-4 animate-spin" />}
                  {verificationAutoCheckExpired
                    ? 'Automatic checks paused. Check the inbox when you are ready.'
                    : 'Waiting for a new feedback item…'}
                </div>
              )}
              {feedbackCheckError ? (
                <p className="mt-2 text-xs leading-5 text-destructive">The automatic check hit a connection error and will keep retrying. Use “Check inbox now” to retry immediately.</p>
              ) : null}
            </div>

            <Button size="sm" variant="outline" className="mt-5" onClick={() => void checkEmbed()}>
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Check connection
            </Button>
          </aside>
        </div>

        <div className="flex flex-col gap-4 border-t bg-surface-soft/45 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">After the first test, make the form yours.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Change placement, wording, fields, colors, screenshots, and spam protection without replacing the snippet.</p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href={`/projects/${projectId}/feedback-form`}>
              <Palette className="mr-2 h-4 w-4" />
              Customize feedback form
            </Link>
          </Button>
        </div>
      </section>

      <details
        className="rounded-lg border bg-card"
        onToggle={(event) => setHostedPreviewOpen(event.currentTarget.open)}
      >
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold">
          <span className="flex items-center gap-2.5">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Troubleshooting: test the saved form here
          </span>
          <Badge variant="outline">{modeLabel} mode</Badge>
        </summary>
        {hostedPreviewOpen ? (
          <div className="space-y-5 border-t p-5">
            <div>
              <h2 className="text-lg font-semibold">Hosted control test</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Use this only to separate a form or API problem from an installation problem. {hostedInstruction}
              </p>
            </div>
            <WidgetPreviewSurface
              appOrigin={appOrigin}
              projectKey={projectKey}
              config={savedConfig}
              className="min-h-56"
              onStatusChange={(nextStatus, nextError) => {
                setHostedPreviewStatus(nextStatus)
                setHostedPreviewError(nextError || null)
              }}
            />
            <div className="text-sm" aria-live="polite">
              {hostedFeedbackId ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/25 bg-primary/[0.04] p-3">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Hosted form reached the inbox. Your saved form works.
                  </span>
                  <Link href={`/feedback/${hostedFeedbackId}`} className="font-medium text-primary hover:underline">Open control item</Link>
                </div>
              ) : hostedPreviewStatus === 'loading' ? (
                <span className="text-muted-foreground">Loading the saved form…</span>
              ) : hostedPreviewStatus === 'error' ? (
                <span className="text-destructive">The hosted form could not be loaded: {hostedPreviewError}</span>
              ) : (
                <span className="text-muted-foreground">The saved form is ready for a control test.</span>
              )}
            </div>
          </div>
        ) : null}
      </details>

      <details className="rounded-lg border bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 font-semibold">Installation troubleshooting and safe diagnostics</summary>
        <div className="space-y-4 border-t p-5 text-sm leading-6 text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Wrong key:</strong> copy the current `fb_pub_…` snippet from Install &amp; verify.</li>
            <li><strong className="text-foreground">CSP or ad blocker:</strong> allow the feedbacks.dev script and API host, then test in a clean browser profile.</li>
            <li><strong className="text-foreground">Cached deployment:</strong> publish the changed app shell and hard-refresh the target page.</li>
            <li><strong className="text-foreground">SPA route transition:</strong> install the embed once in the persistent app shell, not inside a page component.</li>
            <li><strong className="text-foreground">Origin restriction:</strong> leave it off during setup, then add the exact production origin after verification.</li>
            <li><strong className="text-foreground">Duplicate script:</strong> keep one host element and one script load.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void copyDiagnostics()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy diagnostic packet
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${projectId}/install`}>Return to install instructions</Link>
            </Button>
          </div>
          <p role="status" aria-live="polite">
            {diagnosticCopyState === 'copied'
              ? 'Diagnostic packet copied. It contains the public project key but no private API key.'
              : diagnosticCopyState === 'error'
                ? 'Clipboard access was denied. Copy the visible status details manually.'
                : 'The packet contains connection status and public install information only, never private credentials.'}
          </p>
        </div>
      </details>
    </div>
  )
}

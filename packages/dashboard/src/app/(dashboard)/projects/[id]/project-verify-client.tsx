'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildRuntimeWidgetConfig,
  getWidgetExpectation,
  getWidgetModeLabel,
  type SavedWidgetConfig,
} from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Copy, ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react'
import { WidgetPreviewSurface } from './widget-preview-surface'
import { SetupProgress } from './project-flow-nav'
import { PageHeader } from '@/components/ui/workspace-shell'

interface ProjectVerifyClientProps {
  appOrigin: string
  projectId: string
  projectKey: string
  projectName: string
  savedConfig: SavedWidgetConfig
}

export function ProjectVerifyClient({
  appOrigin,
  projectId,
  projectKey,
  projectName,
  savedConfig,
}: ProjectVerifyClientProps) {
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = React.useState<string | null>(null)
  const [verifiedFeedbackId, setVerifiedFeedbackId] = React.useState<string | null>(null)
  const [embedStatus, setEmbedStatus] = React.useState<{
    state: 'loading' | 'not_detected' | 'connected' | 'stale' | 'error'
    lastSeenAt: string | null
    runtimeVersion: string | null
  }>({ state: 'loading', lastSeenAt: null, runtimeVersion: null })
  const [diagnosticCopyState, setDiagnosticCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle')

  const checkEmbed = React.useCallback(async () => {
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
    }
  }, [projectId])

  React.useEffect(() => {
    void checkEmbed()
    const interval = window.setInterval(() => void checkEmbed(), 5000)
    return () => window.clearInterval(interval)
  }, [checkEmbed])

  React.useEffect(() => {
    const handleSubmission = (event: Event) => {
      const feedbackId = (event as CustomEvent<{ id?: string }>).detail?.id
      if (feedbackId) {
        setVerifiedFeedbackId(feedbackId)
        void fetch(`/api/projects/${projectId}/activation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'verification_completed' }),
        })
      }
    }

    window.addEventListener('feedbacks:submitted', handleSubmission)
    return () => window.removeEventListener('feedbacks:submitted', handleSubmission)
  }, [projectId])

  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey, savedConfig, { appOrigin }),
    [appOrigin, projectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const runtimeExpectation = getWidgetExpectation(runtimeConfig)
  const verifyInstruction = runtimeConfig.embedMode === 'inline'
    ? 'The form should show inside the box below. Fill it out and send one test.'
    : runtimeConfig.embedMode === 'trigger'
      ? 'Click the test button in the box below. Fill out the form and send one test.'
      : `Click the "${runtimeConfig.buttonText || 'Feedback'}" button in the bottom-right corner. Fill out the form and send one test.`

  const copyDiagnostics = async () => {
    const packet = [
      'feedbacks.dev install diagnostic',
      `Project: ${projectId}`,
      `Publishable key: ${projectKey}`,
      `Embed state: ${embedStatus.state}`,
      `Last seen: ${embedStatus.lastSeenAt || 'never'}`,
      `Runtime: ${embedStatus.runtimeVersion || 'unknown'}`,
      `Hosted preview: ${status}`,
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
    <div className="mx-auto max-w-7xl space-y-6" data-tour="verify-surface">
      <SetupProgress projectId={projectId} activeStep="verify" />

      {verifiedFeedbackId && (
        <div className="flex flex-col gap-4 rounded-lg border border-primary/35 bg-card p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between" role="status">
          <div className="flex min-w-0 gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Verification reached the inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The project key, saved configuration, submission endpoint, and inbox path are working.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <a href={`/feedback/${verifiedFeedbackId}`}>
              Open verified item
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}

      <div data-tour="verify-guide">
        <PageHeader
          eyebrow={projectName}
          title="Verify one test"
          description="Send a known message here, then confirm it reaches the project inbox. This hosted page tests the saved form and inbox path."
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Saved config</Badge>
              <Badge variant="outline">{modeLabel} mode</Badge>
            </div>
            <h2 className="mt-5 text-base font-semibold">Three quick checks</h2>
          <ol className="mt-5 divide-y overflow-hidden rounded-lg border bg-[oklch(var(--surface-raised))] px-4 text-sm text-muted-foreground">
            <li className="grid grid-cols-[24px_1fr] gap-2 py-3">
              <span className="font-medium text-foreground">1</span><span>Find the form here. {verifyInstruction}</span>
            </li>
            <li className="grid grid-cols-[24px_1fr] gap-2 py-3">
              <span className="font-medium text-foreground">2</span><span>Type <span className="font-medium text-foreground">Install test for {projectName}</span>.</span>
            </li>
            <li className="grid grid-cols-[24px_1fr] gap-2 py-3">
              <span className="font-medium text-foreground">3</span><span>Send it, then open the verified inbox item.</span>
            </li>
          </ol>
            <div className="mt-5 rounded-md border bg-surface-inset/55 p-3 text-sm">
              <div className="flex items-start gap-2">
                {embedStatus.state === 'connected'
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  : <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-500" />}
                <div>
                  <p className="font-medium text-foreground">
                    {embedStatus.state === 'connected'
                      ? 'Your website embed was detected'
                      : embedStatus.state === 'stale'
                        ? 'The last website connection is stale'
                        : embedStatus.state === 'loading'
                          ? 'Checking your website connection…'
                          : 'Your website embed has not been detected'}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {embedStatus.lastSeenAt
                      ? `Last seen ${new Date(embedStatus.lastSeenAt).toLocaleString()}${embedStatus.runtimeVersion ? ` · runtime ${embedStatus.runtimeVersion}` : ''}.`
                      : 'Load a page on your site after pasting the snippet, then check again.'}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => void checkEmbed()}>
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Check again
              </Button>
            </div>
            <div className="mt-5 text-sm leading-6 text-muted-foreground">
              {status === 'loading' && 'Loading the live widget runtime…'}
              {status === 'ready' && `Ready. ${runtimeExpectation}`}
              {status === 'error' && `The widget could not be loaded: ${error}`}
            </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
            <div className="bg-muted/25 p-5 sm:p-7">
              <div className="max-w-xl space-y-3">
                <p className="text-xs font-medium text-primary">Live saved configuration</p>
                <h2 className="text-2xl font-semibold tracking-tight">Send one test message.</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {verifyInstruction}
                </p>
              </div>

              <div className="mt-8 min-h-56 border border-dashed border-foreground/15 bg-background p-6">
                <WidgetPreviewSurface
                  appOrigin={appOrigin}
                  projectKey={projectKey}
                  config={savedConfig}
                  onStatusChange={(nextStatus, nextError) => {
                    setStatus(nextStatus)
                    setError(nextError || null)
                  }}
                />
              </div>

              <div className="mt-5 border-t border-foreground/10 pt-4 text-sm text-muted-foreground">
                If this page works but your website does not, the saved form is fine. Check where the install code was pasted on your site.
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t bg-surface-inset/45 p-5">
              <Link href={`/feedback?projectId=${projectId}`}>
                <Button>
                  Open project inbox
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/projects/${projectId}/install`}>
                <Button variant="outline">Return to install instructions</Button>
              </Link>
            </div>
        </section>
      </div>

      <details className="rounded-lg border bg-card">
        <summary className="cursor-pointer list-none px-5 py-4 font-semibold">Website troubleshooting and safe diagnostics</summary>
        <div className="space-y-4 border-t p-5 text-sm leading-6 text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-foreground">Wrong key:</strong> copy the current `fb_pub_…` snippet from Install &amp; verify.</li>
            <li><strong className="text-foreground">CSP or ad blocker:</strong> allow the feedbacks.dev script and API host, then test in a clean browser profile.</li>
            <li><strong className="text-foreground">Cached deployment:</strong> publish the changed app shell and hard-refresh the target page.</li>
            <li><strong className="text-foreground">SPA route transition:</strong> install the embed once in the persistent app shell, not inside a page component.</li>
            <li><strong className="text-foreground">Origin restriction:</strong> leave it off during setup, then add the exact production origin after verification.</li>
            <li><strong className="text-foreground">Duplicate script:</strong> keep one host element and one script load.</li>
          </ul>
          <Button variant="outline" onClick={() => void copyDiagnostics()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy diagnostic packet
          </Button>
          <p role="status" aria-live="polite">
            {diagnosticCopyState === 'copied'
              ? 'Diagnostic packet copied. It contains the public project key but no private API key.'
              : diagnosticCopyState === 'error'
                ? 'Clipboard access was denied. Copy the visible status details manually.'
                : 'The packet contains connection status and public install information only—never private credentials.'}
          </p>
        </div>
      </details>
    </div>
  )
}

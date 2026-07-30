'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildRuntimeWidgetConfig,
  getWidgetExpectation,
  getWidgetModeLabel,
  type SavedWidgetConfig,
} from '@feedbacks/shared'
import { readStoredProjectApiKey, rememberProjectApiKey } from '@/lib/project-api-keys'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react'
import { WidgetPreviewSurface } from './widget-preview-surface'
import { SetupProgress } from './project-flow-nav'
import { PageHeader } from '@/components/ui/workspace-shell'

interface ProjectVerifyClientProps {
  appOrigin: string
  projectId: string
  projectKey: string | null
  apiKeyLastFour: string | null
  projectName: string
  savedConfig: SavedWidgetConfig
}

export function ProjectVerifyClient({
  appOrigin,
  projectId,
  projectKey,
  apiKeyLastFour,
  projectName,
  savedConfig,
}: ProjectVerifyClientProps) {
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = React.useState<string | null>(null)
  const [resolvedProjectKey, setResolvedProjectKey] = React.useState<string | null>(projectKey)
  const [verifiedFeedbackId, setVerifiedFeedbackId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (projectKey) {
      rememberProjectApiKey(projectId, projectKey)
      setResolvedProjectKey(projectKey)
      return
    }

    const storedKey = readStoredProjectApiKey(projectId)
    if (storedKey) {
      setResolvedProjectKey(storedKey)
    }
  }, [projectId, projectKey])

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
    () => buildRuntimeWidgetConfig(resolvedProjectKey || 'fb_verify_placeholder', savedConfig, { appOrigin }),
    [appOrigin, resolvedProjectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const runtimeExpectation = getWidgetExpectation(runtimeConfig)
  const verifyInstruction = runtimeConfig.embedMode === 'inline'
    ? 'The form should show inside the box below. Fill it out and send one test.'
    : runtimeConfig.embedMode === 'trigger'
      ? 'Click the test button in the box below. Fill out the form and send one test.'
      : `Click the "${runtimeConfig.buttonText || 'Feedback'}" button in the bottom-right corner. Fill out the form and send one test.`

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
            <div className="mt-5 text-sm leading-6 text-muted-foreground">
              {!resolvedProjectKey && 'A fresh project key is required before this hosted page can submit live test feedback.'}
              {resolvedProjectKey && status === 'loading' && 'Loading the live widget runtime…'}
              {resolvedProjectKey && status === 'ready' && `Ready. ${runtimeExpectation}`}
              {resolvedProjectKey && status === 'error' && `The widget could not be loaded: ${error}`}
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

              {resolvedProjectKey ? (
                <div className="mt-8 min-h-56 border border-dashed border-foreground/15 bg-background p-6">
                  <WidgetPreviewSurface
                    appOrigin={appOrigin}
                    projectKey={resolvedProjectKey}
                    config={savedConfig}
                    onStatusChange={(nextStatus, nextError) => {
                      setStatus(nextStatus)
                      setError(nextError || null)
                    }}
                  />
                </div>
              ) : (
                <div className="mt-8 min-h-56 border border-dashed border-foreground/15 bg-background p-6">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">This key is hidden now.</p>
                    <p className="mt-1">
                      feedbacks.dev only reveals project keys once. Generate a fresh key from the install tab to run hosted verification again{apiKeyLastFour ? ` for the key ending in ${apiKeyLastFour}` : ''}.
                    </p>
                    <div className="mt-3">
                      <Link href={`/projects/${projectId}/install`}>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Open install and rotate key
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 border-t border-foreground/10 pt-4 text-sm text-muted-foreground">
                If this page works but your website does not, the saved form is fine. Check where the install code was pasted on your site.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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
    </div>
  )
}

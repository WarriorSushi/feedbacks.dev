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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { WidgetPreviewSurface } from './widget-preview-surface'

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

  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(resolvedProjectKey || 'fb_verify_placeholder', savedConfig, { appOrigin }),
    [appOrigin, resolvedProjectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const runtimeExpectation = getWidgetExpectation(runtimeConfig)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/projects/${projectId}?tab=install`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to install
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Verify {projectName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This hosted page uses the live widget runtime and your saved config. If a test item lands in the inbox here, your install inputs are correct before you troubleshoot your own app.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/feedback?projectId=${projectId}`}>
            <Button variant="outline">Open project inbox</Button>
          </Link>
          <Link href={`/projects/${projectId}?tab=customize`}>
            <Button variant="outline">Customize widget</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Saved config</Badge>
              <Badge variant="outline">{modeLabel} mode</Badge>
            </div>
            <CardTitle className="text-lg">Verification checklist</CardTitle>
            <CardDescription>
              Treat this as the proof step before integrations, board setup, or deeper customization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/20 p-4">
              1. Confirm the widget is visible on this page. {runtimeExpectation}
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              2. Submit a short message like <span className="font-medium text-foreground">Install verification for {projectName}</span>.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              3. Open the project inbox and confirm the test item appears.
            </div>
            <div className="rounded-lg border border-dashed bg-muted/10 p-4">
              {!resolvedProjectKey && 'A fresh project key is required before this hosted page can submit live test feedback.'}
              {resolvedProjectKey && status === 'loading' && 'Loading the live widget runtime…'}
              {resolvedProjectKey && status === 'ready' && `The widget runtime is ready. ${runtimeExpectation}`}
              {resolvedProjectKey && status === 'error' && `The widget could not be loaded: ${error}`}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Live verification surface</CardTitle>
            <CardDescription>
              This safe hosted page removes placement and app-shell variables. It is meant to prove the install path, not replace your real product surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="max-w-xl space-y-3">
                <p className="text-sm font-medium text-foreground">Verification sandbox</p>
                <h2 className="text-3xl font-semibold tracking-tight">Make sure your feedback path works end to end.</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The widget on this page is initialized with the same saved configuration used by your install snippets. When you submit a test item here, it should land in the same project inbox without any extra setup.
                </p>
              </div>

              {resolvedProjectKey ? (
                <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 p-6">
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
                <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 p-6">
                  <div className="rounded-xl border border-primary/20 bg-background p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">This key is hidden now.</p>
                    <p className="mt-1">
                      feedbacks.dev only reveals project keys once. Generate a fresh key from the install tab to run hosted verification again{apiKeyLastFour ? ` for the key ending in ${apiKeyLastFour}` : ''}.
                    </p>
                    <div className="mt-3">
                      <Link href={`/projects/${projectId}?tab=install`}>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Open install and rotate key
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                If this page works but your product page does not, leave the config alone and check where the snippet is pasted in your app. That is usually the missing piece on first install.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/feedback?projectId=${projectId}`}>
                <Button>
                  Open project inbox
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/projects/${projectId}?tab=install`}>
                <Button variant="outline">Return to install instructions</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

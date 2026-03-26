'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildRuntimeWidgetConfig,
  type SavedWidgetConfig,
} from '@feedbacks/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { WidgetPreviewSurface } from './widget-preview-surface'

interface ProjectVerifyClientProps {
  appOrigin: string
  projectId: string
  projectKey: string
  projectName: string
  savedConfig: SavedWidgetConfig
}

type WidgetRuntimeWindow = Window & {
  FeedbacksWidget?: new (config: ReturnType<typeof buildRuntimeWidgetConfig>) => { destroy?: () => void }
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

  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey, savedConfig, { appOrigin }),
    [appOrigin, projectKey, savedConfig],
  )
  const modeLabel = runtimeConfig.embedMode === 'inline'
    ? 'Inline'
    : runtimeConfig.embedMode === 'trigger'
      ? 'Trigger'
      : 'Modal'

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
            This page uses the live widget runtime and your saved config. Submit one test item, then open the inbox to confirm it arrived.
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
              Follow these three steps before you move on to integrations or board setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-muted/20 p-4">
              1. Confirm the widget is visible on this page.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              2. Submit a short message like <span className="font-medium text-foreground">Install verification for {projectName}</span>.
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              3. Open the project inbox and confirm the test item appears.
            </div>
            <div className="rounded-lg border border-dashed bg-muted/10 p-4">
              {status === 'loading' && 'Loading the live widget runtime…'}
              {status === 'ready' && 'The widget runtime is ready. If you saved modal mode, look for the floating launcher near the lower-right corner.'}
              {status === 'error' && `The widget could not be loaded: ${error}`}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Live verification surface</CardTitle>
            <CardDescription>
              This is a safe hosted page for first-run testing. It is meant to prove the install path, not replace your real product surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <div className="max-w-xl space-y-3">
                <p className="text-sm font-medium text-foreground">Verification sandbox</p>
                <h2 className="text-3xl font-semibold tracking-tight">Make sure your feedback path works end to end.</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The widget on this page is initialized with the same saved configuration used by your install snippets. When you submit a test item here, it should land in the same project inbox.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 p-6">
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

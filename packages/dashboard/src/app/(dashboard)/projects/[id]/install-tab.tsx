'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildFeedbackApiUrl,
  buildRuntimeWidgetConfig,
  generateInstallSnippets,
  getWidgetExpectation,
  getWidgetModeLabel,
  type InstallSnippet,
  buildWidgetScriptUrl,
} from '@feedbacks/shared'
import type { Project } from '@/lib/types'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeSnippet } from '@/components/code-snippet'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, ExternalLink, Loader2, Sparkles } from 'lucide-react'

interface InstallTabProps {
  project: Project
  projectKey: string | null
  apiKeyLastFour: string | null
  rotatingApiKey: boolean
  onRotateApiKey: () => Promise<void>
  created: boolean
}

export function InstallTab({
  project,
  projectKey,
  apiKeyLastFour,
  rotatingApiKey,
  onRotateApiKey,
  created,
}: InstallTabProps) {
  const [copied, setCopied] = React.useState(false)
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const savedConfig = React.useMemo(
    () => project.settings?.widget_config || {},
    [project.settings?.widget_config],
  )
  const snippets = React.useMemo<InstallSnippet[]>(
    () =>
      projectKey
        ? generateInstallSnippets({
          projectKey,
          savedConfig,
          appOrigin,
        })
        : [],
    [appOrigin, projectKey, savedConfig],
  )
  const websiteSnippet = snippets.find((snippet) => snippet.label === 'Website')?.code || ''
  const widgetScriptUrl = buildWidgetScriptUrl(appOrigin)
  const feedbackApiUrl = buildFeedbackApiUrl(appOrigin)
  const cspSnippet = `default-src 'self';\nscript-src 'self' ${new URL(widgetScriptUrl).origin};\nconnect-src 'self' ${new URL(feedbackApiUrl).origin};\nstyle-src 'self' 'unsafe-inline';\nimg-src 'self' data: blob:;`
  const sriCommand = `node -e "const fs=require('node:fs');const crypto=require('node:crypto');const file='packages/dashboard/public/widget/latest.js';const hash=crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');console.log('integrity=\\\"sha384-'+hash+'\\\"')"`
  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey || 'fb_install_preview', savedConfig, { appOrigin }),
    [appOrigin, projectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const expectedResult = getWidgetExpectation(runtimeConfig)

  const copyWebsiteSnippet = async () => {
    if (!websiteSnippet) return
    await navigator.clipboard.writeText(websiteSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/[0.05]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/90 text-primary-foreground">
              {created ? 'Project created' : 'Install overview'}
            </Badge>
            <Badge variant="outline">{modeLabel} mode</Badge>
            <span className="text-xs font-medium text-primary">First feedback in three steps</span>
          </div>
          <CardTitle className="text-xl">Get a working install live before you customize anything else</CardTitle>
          <CardDescription>
            Start with the Website snippet. It is the canonical copy-paste path, and the hosted verification page uses the same saved config.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              '1. Copy the Website snippet from this page.',
              '2. Open the verification page and submit one test message.',
              '3. Open the project inbox and confirm the item arrived.',
            ].map((step) => (
              <div key={step} className="rounded-lg border border-primary/20 bg-background/80 px-4 py-3 text-sm leading-relaxed">
                {step}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/20 bg-background/90 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              This install is wired to
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Project key</p>
                {projectKey ? (
                  <p className="mt-2 break-all rounded bg-background px-2 py-1 font-mono text-xs text-foreground">
                    {projectKey}
                  </p>
                ) : (
                  <div className="mt-2 space-y-2 rounded border border-dashed bg-background px-3 py-3 text-sm text-muted-foreground">
                    <p>
                      The current key is hidden by design{apiKeyLastFour ? ` and ends in ${apiKeyLastFour}` : ''}.
                    </p>
                    <p>
                      feedbacks.dev only reveals project keys once. Rotate it to generate a fresh key you can copy into your app.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => void onRotateApiKey()} disabled={rotatingApiKey}>
                      {rotatingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Generate fresh key
                    </Button>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Saved mode</p>
                <p className="mt-2 text-sm font-medium text-foreground">{modeLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">{expectedResult}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={copyWebsiteSnippet} disabled={!websiteSnippet}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : projectKey ? 'Copy Website snippet' : 'Rotate key to copy snippet'}
              </Button>
              {projectKey ? (
                <Link href={`/projects/${project.id}/verify`}>
                  <Button variant="outline">
                    Run hosted verification
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  Run hosted verification
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Recommended install</CardTitle>
            <CardDescription>
              Paste this exact snippet where your site loads global scripts. It already includes this project key and your last saved widget settings.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {projectKey ? (
            <CodeSnippet tabs={[{ label: 'Website', code: websiteSnippet, language: 'html' }]} />
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              Generate a fresh key to reveal a new install snippet. Existing deployed clients keep working with the old key because only the raw database copy was removed.
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Where this goes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste the snippet into your site where global scripts load, usually just before the closing{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;/body&gt;</code>.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">What you should see next</p>
              <p className="mt-1 text-sm text-muted-foreground">{expectedResult}</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Why this is safe to trust</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The snippet is generated from one shared config model. The same saved settings power this code, the hosted verification page, and the framework examples below.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
            Saved changes from the <span className="font-medium text-foreground">Customize</span> tab update these snippets after you click <span className="font-medium text-foreground">Save Changes</span>. Draft edits stay out of the install flow until you explicitly save them.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Verify the install</CardTitle>
          </div>
          <CardDescription>
            Use the hosted verification page to remove site-specific variables. If feedback lands in the inbox there, your project key and saved config are correct.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              'Open the verification page in a new tab.',
              `Submit a short test item like "Install verification for ${project.name}".`,
              'Open the inbox and confirm the item appears for this project.',
            ].map((step) => (
              <div key={step} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                {step}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {projectKey ? (
              <Link href={`/projects/${project.id}/verify`}>
                <Button>
                  Open verification page
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button disabled>
                Open verification page
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Link href={`/feedback?projectId=${project.id}`}>
              <Button variant="outline">Open project inbox</Button>
            </Link>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
            If the hosted verification page works but your own site does not, keep the saved config as-is and check snippet placement first. Most first-run issues come from where the code is pasted, not from the widget settings.
          </div>
        </CardContent>
      </Card>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-lg font-semibold text-foreground">Need React or Vue instead?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              These examples are generated from the same saved config. Use them once you have proven the basic install path.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">Show framework examples</span>
        </summary>
        <div className="border-t px-6 py-5">
          {projectKey ? (
            <CodeSnippet
              tabs={snippets.map((snippet) => ({
                label: snippet.label,
                code: snippet.code,
                language: snippet.language,
              }))}
            />
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
              Framework examples appear after you generate a fresh key.
            </div>
          )}
        </div>
      </details>

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-lg font-semibold text-foreground">After the widget is live: deployment hardening</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep CSP, SRI, and stronger human-verification as a second pass after the snippet is already working.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">Show security guidance</span>
        </summary>
        <div className="space-y-5 border-t px-6 py-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Recommended CSP baseline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Allow the widget script origin and the feedback API origin explicitly. If you self-host or pin a version, adjust the origins to match your deployment.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Anti-spam baseline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Public board submissions already use rate limiting. For the widget install, save captcha settings in <span className="font-medium text-foreground">Customize</span> if you need stronger protection on public forms.
              </p>
            </div>
          </div>

          <CodeSnippet
            tabs={[
              { label: 'CSP', code: cspSnippet, language: 'bash' },
              { label: 'SRI Hash', code: sriCommand, language: 'bash' },
            ]}
          />

          <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
            Captcha keys stay secondary to install. Verify the widget first, then enable human-verification if your site is public-facing or you expect abuse risk.
          </div>
        </div>
      </details>
    </div>
  )
}

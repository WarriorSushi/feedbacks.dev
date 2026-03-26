'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildFeedbackApiUrl,
  generateInstallSnippets,
  type InstallSnippet,
  buildWidgetScriptUrl,
} from '@feedbacks/shared'
import type { Project } from '@/lib/types'
import { publicEnv } from '@/lib/public-env'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CodeSnippet } from '@/components/code-snippet'
import { Badge } from '@/components/ui/badge'
import { Check, CheckCircle2, Copy, ExternalLink, Sparkles } from 'lucide-react'

interface InstallTabProps {
  project: Project
  created: boolean
}

export function InstallTab({ project, created }: InstallTabProps) {
  const [copied, setCopied] = React.useState(false)
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const snippets = React.useMemo<InstallSnippet[]>(
    () => generateInstallSnippets({
      projectKey: project.api_key,
      savedConfig: project.settings?.widget_config || {},
      appOrigin,
    }),
    [appOrigin, project.api_key, project.settings?.widget_config],
  )
  const websiteSnippet = snippets.find((snippet) => snippet.label === 'Website')?.code || ''
  const widgetScriptUrl = buildWidgetScriptUrl(appOrigin)
  const feedbackApiUrl = buildFeedbackApiUrl(appOrigin)
  const cspSnippet = `default-src 'self';\nscript-src 'self' ${new URL(widgetScriptUrl).origin};\nconnect-src 'self' ${new URL(feedbackApiUrl).origin};\nstyle-src 'self' 'unsafe-inline';\nimg-src 'self' data: blob:;`
  const sriCommand = `node -e "const fs=require('node:fs');const crypto=require('node:crypto');const file='packages/dashboard/public/widget/latest.js';const hash=crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');console.log('integrity=\\\"sha384-'+hash+'\\\"')"`

  const copyWebsiteSnippet = async () => {
    await navigator.clipboard.writeText(websiteSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {created && (
        <Card className="border-primary/30 bg-primary/[0.05]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/90 text-primary-foreground">Project created</Badge>
              <span className="text-xs font-medium text-primary">Install-first flow</span>
            </div>
            <CardTitle className="text-lg">Your project is ready for first feedback</CardTitle>
            <CardDescription>
              Copy the snippet, verify the widget, and send one test item before moving on to customization.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              '1. Copy the Website snippet',
              '2. Open the verification page and submit a test item',
              '3. Check your inbox to confirm the feedback arrived',
            ].map((step) => (
              <div key={step} className="rounded-lg border border-primary/20 bg-background/80 px-4 py-3 text-sm">
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg">Recommended install</CardTitle>
            <CardDescription>
              Start with the Website snippet. It is the clearest copy-paste path and matches the live widget runtime.
            </CardDescription>
          </div>
          <Button onClick={copyWebsiteSnippet} className="sm:self-center">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Website snippet'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <CodeSnippet tabs={[{ label: 'Website', code: websiteSnippet, language: 'html' }]} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">Where this goes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste the snippet into your site where global scripts load, usually just before the closing{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;/body&gt;</code>.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">What you should see next</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The default modal install shows a floating feedback button. If you saved inline or trigger mode, the snippet already includes the required target markup.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/10 p-4 text-sm text-muted-foreground">
            Saved changes from the <span className="font-medium text-foreground">Customize</span> tab update these snippets after you click <span className="font-medium text-foreground">Save Changes</span>. Unsaved edits do not affect the install output in this phase.
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
            Use the hosted verification page to confirm the widget renders with your saved config and that feedback reaches the inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              'Open the verification page in a new tab.',
              'Submit one test feedback item through the live widget.',
              'Open the inbox and confirm the item appears for this project.',
            ].map((step) => (
              <div key={step} className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                {step}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/projects/${project.id}/verify`} target="_blank" rel="noreferrer">
              <Button>
                Open verification page
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/feedback?projectId=${project.id}`}>
              <Button variant="outline">Open project inbox</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Framework examples</CardTitle>
          <CardDescription>
            These examples are generated from the same saved widget config. Website stays the default recommendation; React and Vue use the real thin wrapper packages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeSnippet
            tabs={snippets.map((snippet) => ({
              label: snippet.label,
              code: snippet.code,
              language: snippet.language,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Success checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'The snippet is copied from this page, not retyped by hand.',
            'The widget renders on the verification page or your site without guessing.',
            'A test feedback item appears in the inbox before you move on to integrations or workflow routing.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security and anti-spam guidance</CardTitle>
          <CardDescription>
            Install trust includes deployment guidance. Start simple, then add CSP/SRI and human-verification once the basic snippet is live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">Recommended CSP baseline</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Allow the widget script origin and the feedback API origin explicitly. If you self-host or pin a version, adjust the origins to match your deployment.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium">Anti-spam baseline</p>
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
        </CardContent>
      </Card>
    </div>
  )
}

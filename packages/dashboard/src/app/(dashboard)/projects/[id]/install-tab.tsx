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
import { CodeSnippet } from '@/components/code-snippet'
import { Badge } from '@/components/ui/badge'
import { PageHeader, SectionPanel } from '@/components/ui/workspace-shell'
import { ArrowRight, Bot, CheckCircle2, KeyRound, Loader2, RefreshCw, XCircle } from 'lucide-react'

interface InstallTabProps {
  project: Project
  projectKey: string
}

interface SetupTokenStatus {
  token_id: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

type InstallPlatform = 'website' | 'wordpress' | 'html-block' | 'react' | 'next' | 'vue' | 'mobile'

export function InstallTab({
  project,
  projectKey,
}: InstallTabProps) {
  const [setupPacket, setSetupPacket] = React.useState<{ tokenId: string; packetUrl: string; expiresAt: string } | null>(null)
  const [setupPacketLoading, setSetupPacketLoading] = React.useState(false)
  const [setupTokensLoading, setSetupTokensLoading] = React.useState(false)
  const [revokingTokenId, setRevokingTokenId] = React.useState<string | null>(null)
  const [setupPacketError, setSetupPacketError] = React.useState<string | null>(null)
  const [setupTokens, setSetupTokens] = React.useState<SetupTokenStatus[]>([])
  const [activePlatform, setActivePlatform] = React.useState<InstallPlatform>('website')
  const [hasCopiedSnippet, setHasCopiedSnippet] = React.useState(false)
  const appOrigin = publicEnv.NEXT_PUBLIC_APP_ORIGIN
  const savedConfig = React.useMemo(
    () => project.settings?.widget_config || {},
    [project.settings?.widget_config],
  )
  const snippets = React.useMemo<InstallSnippet[]>(
    () => generateInstallSnippets({
      projectKey,
      savedConfig,
      appOrigin,
    }),
    [appOrigin, projectKey, savedConfig],
  )
  const websiteSnippet = snippets.find((snippet) => snippet.label === 'Website')?.code || ''
  const reactSnippet = snippets.find((snippet) => snippet.label === 'React')?.code || ''
  const vueSnippet = snippets.find((snippet) => snippet.label === 'Vue')?.code || ''
  const widgetScriptUrl = buildWidgetScriptUrl(appOrigin)
  const feedbackApiUrl = buildFeedbackApiUrl(appOrigin)
  const cspSnippet = `default-src 'self';\nscript-src 'self' ${new URL(widgetScriptUrl).origin};\nconnect-src 'self' ${new URL(feedbackApiUrl).origin};\nstyle-src 'self' 'unsafe-inline';\nimg-src 'self' data: blob:;`
  const sriCommand = `node -e "const fs=require('node:fs');const crypto=require('node:crypto');const file='packages/dashboard/public/widget/latest.js';const hash=crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');console.log('integrity=\\\"sha384-'+hash+'\\\"')"`
  const runtimeConfig = React.useMemo(
    () => buildRuntimeWidgetConfig(projectKey, savedConfig, { appOrigin }),
    [appOrigin, projectKey, savedConfig],
  )
  const modeLabel = getWidgetModeLabel(runtimeConfig)
  const expectedResult = getWidgetExpectation(runtimeConfig)
  const verifyInstruction = runtimeConfig.embedMode === 'inline'
    ? 'After you paste the code, open the page where you placed the form. Fill it out and send one test.'
    : runtimeConfig.embedMode === 'trigger'
      ? `After you paste the code, open your site and click your own feedback button. Fill out the form and send one test.`
      : `After you paste the code, open your site and click the "${runtimeConfig.buttonText || 'Feedback'}" button. Fill out the form and send one test.`
  const agentSetupPrompt = React.useMemo(() => {
    const setupPacket = {
      project: {
        id: project.id,
        name: project.name,
        publicKey: projectKey,
        domain: project.domain || null,
      },
      widget: {
        recommendedPath: 'Website snippet first. Use React or Vue only when the app shell clearly needs it.',
        endpoint: feedbackApiUrl,
        scriptUrl: widgetScriptUrl,
        mode: modeLabel,
        expectedResult,
        snippets: snippets.reduce<Record<string, string>>((acc, snippet) => {
          acc[snippet.label] = snippet.code
          return acc
        }, {}),
      },
      verification: {
        url: `${appOrigin}/projects/${project.id}/verify`,
        instructions: [
          'Install the recommended Website snippet in the app shell or global HTML.',
          'Run the app locally and confirm the feedback UI appears.',
          'Submit one test report from a real page and confirm the request succeeds.',
          'Ask the user to confirm the report appears in the project inbox unless authenticated MCP access is available.',
        ],
      },
      safety: [
        'Do not expose private API keys in browser code.',
        'Keep the first install minimal before changing advanced settings.',
        'If the hosted verification works but the app does not, inspect snippet placement first.',
      ],
    }

    return `Use this feedbacks.dev setup packet to add feedback collection to my app.

Goals:
1. Install the recommended Website snippet unless the app has a clearer React or Vue integration point.
2. Keep the first pass minimal.
3. Do not expose private API keys.
4. Run the app locally and confirm the feedback UI appears.
5. Submit one test report, report whether the request succeeds, and ask me to confirm it appears in the inbox unless you have authenticated MCP access.

Setup packet:
${JSON.stringify(setupPacket, null, 2)}`
  }, [appOrigin, expectedResult, feedbackApiUrl, modeLabel, project.domain, project.id, project.name, projectKey, snippets, widgetScriptUrl])

  const loadSetupTokens = React.useCallback(async () => {
    setSetupTokensLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/setup-token`, { cache: 'no-store' })
      if (!response.ok) return
      const payload = await response.json()
      setSetupTokens(Array.isArray(payload.tokens) ? payload.tokens : [])
    } finally {
      setSetupTokensLoading(false)
    }
  }, [project.id])

  React.useEffect(() => {
    void loadSetupTokens()
  }, [loadSetupTokens])

  const createSetupPacketLink = async () => {
    setSetupPacketLoading(true)
    setSetupPacketError(null)
    try {
      const response = await fetch(`/api/projects/${project.id}/setup-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectKey }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create setup packet link')
      }
      setSetupPacket({
        tokenId: payload.tokenId,
        packetUrl: payload.packetUrl,
        expiresAt: payload.expiresAt,
      })
      await loadSetupTokens()
    } catch (error) {
      setSetupPacketError(error instanceof Error ? error.message : 'Failed to create setup packet link')
    } finally {
      setSetupPacketLoading(false)
    }
  }

  const revokeSetupToken = async (tokenId: string) => {
    setRevokingTokenId(tokenId)
    setSetupPacketError(null)
    try {
      const response = await fetch(`/api/projects/${project.id}/setup-token`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to revoke setup token')
      }
      if (setupPacket?.tokenId === tokenId) {
        setSetupPacket(null)
      }
      await loadSetupTokens()
    } catch (error) {
      setSetupPacketError(error instanceof Error ? error.message : 'Failed to revoke setup token')
    } finally {
      setRevokingTokenId(null)
    }
  }

  const activeSetupTokens = setupTokens.filter((token) => {
    return !token.revoked_at && new Date(token.expires_at).getTime() > Date.now()
  })
  const nextSnippet = `"use client"

import Script from "next/script"

export function FeedbacksWidgetScript() {
  return (
    <>
      <div data-feedbacks-host="${projectKey}" />
      <Script
        src="${widgetScriptUrl}"
        data-project="${projectKey}"
        strategy="afterInteractive"
      />
    </>
  )
}`
  const installTargets: Array<{
    id: InstallPlatform
    label: string
    title: string
    body: string
    code: string | null
    language: string
    packageCommand?: string
    placement: string
    expected: string
  }> = [
    {
      id: 'website',
      label: 'Website',
      title: 'Website script',
      body: 'Best for plain HTML, app shells, templates, and global custom-code fields.',
      code: websiteSnippet,
      language: 'html',
      placement: 'Paste before the closing body tag, or in a site-wide footer/custom-code field.',
      expected: expectedResult,
    },
    {
      id: 'wordpress',
      label: 'WordPress',
      title: 'WordPress script',
      body: 'Use the same Website script, installed through a footer/header code tool.',
      code: websiteSnippet,
      language: 'html',
      placement: 'Use a site-wide footer injection plugin, theme footer, or custom-code area. A page HTML block may only load on that page.',
      expected: expectedResult,
    },
    {
      id: 'html-block',
      label: 'HTML block',
      title: 'HTML block script',
      body: 'Works only when the builder allows raw scripts in the block.',
      code: websiteSnippet,
      language: 'html',
      placement: 'Prefer global custom code. If using a block, publish the live page and confirm the builder did not strip or sandbox the script.',
      expected: expectedResult,
    },
    {
      id: 'react',
      label: 'React',
      title: 'React root script',
      body: 'Use the hosted script once in the root HTML so it survives React renders and route changes.',
      code: reactSnippet,
      language: 'html',
      placement: 'Paste this inside the body of the root index.html file, after the React mount element.',
      expected: expectedResult,
    },
    {
      id: 'next',
      label: 'Next.js',
      title: 'Next.js component',
      body: 'Use a client component with next/script so the widget loads after hydration.',
      code: nextSnippet,
      language: 'tsx',
      placement: 'Render this client component from your root layout or app shell.',
      expected: expectedResult,
    },
    {
      id: 'vue',
      label: 'Vue',
      title: 'Vue root script',
      body: 'Use the hosted script once in the root HTML so it survives Vue renders and route changes.',
      code: vueSnippet,
      language: 'html',
      placement: 'Paste this inside the body of the root index.html file, after the Vue mount element.',
      expected: expectedResult,
    },
    {
      id: 'mobile',
      label: 'Mobile app',
      title: 'Native mobile guidance',
      body: 'The browser script does not run inside native iOS, Android, React Native, or Flutter screens.',
      code: null,
      language: 'text',
      placement: 'Use a WebView only for web content. For native screens, use the REST API or wait for a native SDK.',
      expected: 'No browser widget appears in native UI unless the app is rendering web content in a WebView.',
    },
  ]
  const selectedTarget = installTargets.find((target) => target.id === activePlatform) || installTargets[0]
  const primaryTargets = installTargets.filter((target) => ['website', 'react', 'next', 'vue'].includes(target.id))
  const secondaryTargets = installTargets.filter((target) => !['website', 'react', 'next', 'vue'].includes(target.id))

  return (
    <div className="space-y-6" data-tour="install-workspace">
      <PageHeader
        eyebrow={project.name}
        title="Install feedback"
        description="Choose your stack, copy the snippet once, then verify a real test."
      />

      <SectionPanel
        title="Choose your stack"
        description={selectedTarget.body}
        dataTour="install-snippet"
        contentClassName="space-y-4"
      >
        <div data-tour="install-platforms" className="flex flex-wrap gap-1 rounded-md border bg-surface-inset p-1" role="group" aria-label="Install platform">
          {primaryTargets.map((target) => (
            <button
              key={target.id}
              type="button"
              aria-pressed={activePlatform === target.id}
              onClick={() => setActivePlatform(target.id)}
              className={`min-h-10 rounded px-3 text-sm font-medium transition-colors ${
                activePlatform === target.id
                  ? 'bg-surface-soft text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-surface-soft/70 hover:text-foreground'
              }`}
            >
              {target.label}
              {target.id === 'website' && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Recommended</span>}
            </button>
          ))}
          <details className="group relative">
            <summary className={`flex min-h-10 cursor-pointer list-none items-center rounded px-3 text-sm font-medium transition-colors ${
              secondaryTargets.some((target) => target.id === activePlatform)
                ? 'bg-surface-soft text-foreground shadow-sm ring-1 ring-border'
                : 'text-muted-foreground hover:bg-surface-soft/70 hover:text-foreground'
            }`}>
              Other
            </summary>
            <div className="absolute left-0 top-11 z-20 min-w-52 overflow-hidden rounded-md border bg-popover p-1 shadow-[var(--shadow-float)]">
              {secondaryTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  aria-pressed={activePlatform === target.id}
                  onClick={() => setActivePlatform(target.id)}
                  className={`flex min-h-10 w-full items-center rounded px-3 text-left text-sm ${
                    activePlatform === target.id ? 'bg-surface-selected text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {target.label}
                </button>
              ))}
            </div>
          </details>
        </div>

        {selectedTarget.code ? (
          <div data-tour="install-code" className="space-y-4">
            {selectedTarget.packageCommand && (
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">1. Install the package</p>
                <CodeSnippet
                  tabs={[{ label: 'PNPM', code: selectedTarget.packageCommand, language: 'bash' }]}
                  maxHeightClassName="max-h-28"
                />
                <p className="mb-2 mt-4 text-sm font-medium text-foreground">2. Add the component</p>
              </div>
            )}
            <CodeSnippet
              tabs={[{
                label: selectedTarget.label,
                code: selectedTarget.code,
                language: selectedTarget.language,
              }]}
              onCopied={() => {
                setHasCopiedSnippet(true)
                void fetch(`/api/projects/${project.id}/activation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ event: 'install_code_copied' }),
                }).catch(() => undefined)
              }}
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-surface-raised/60 p-4 text-sm leading-6 text-muted-foreground">
            Native apps use the REST API. The browser snippet only works in web content or a WebView.
            <Link href={`/projects/${project.id}?tab=api`} className="ml-1 font-medium text-primary hover:underline">Open API docs</Link>
          </div>
        )}

        <div className="divide-y rounded-md border bg-surface-soft/65">
          <div className="grid gap-1 px-4 py-3 md:grid-cols-[140px_minmax(0,1fr)]">
            <p className="text-sm font-medium text-foreground">Paste it here</p>
            <p className="text-sm leading-6 text-muted-foreground">{selectedTarget.placement}</p>
          </div>
          <div className="grid gap-1 px-4 py-3 md:grid-cols-[140px_minmax(0,1fr)]">
            <p className="text-sm font-medium text-foreground">You should see</p>
            <p data-testid="install-verify-instruction" className="text-sm leading-6 text-muted-foreground">{verifyInstruction}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-2.5 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><span className="font-medium text-foreground">The snippet stays the same.</span> Form and product-update changes publish remotely.</p>
          </div>
          <Button asChild className="min-h-11 shrink-0 gap-2">
            <Link href={`/projects/${project.id}/verify`}>
              {hasCopiedSnippet ? 'Test in your product' : 'Continue to product test'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SectionPanel>

      <details className="group rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
          <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Connection details
          </span>
          <span className="text-xs text-muted-foreground">{modeLabel}</span>
        </summary>
        <div className="grid gap-5 border-t bg-surface-inset/60 p-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Project key</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{projectKey}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Current form</p>
            <p className="mt-1 text-sm font-medium text-foreground">{modeLabel}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{verifyInstruction}</p>
          </div>
        </div>
      </details>

      <details className="group rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">Install with an AI coding agent</p>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Create a short-lived setup packet or copy a repo-aware prompt.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">
            <span className="group-open:hidden">Show agent setup</span>
            <span className="hidden group-open:inline">Hide agent setup</span>
          </span>
        </summary>
        <div className="space-y-4 border-t px-6 py-5">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Short-lived setup packet link</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a 30-minute URL your AI builder can fetch for exact snippets and verification steps.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => void createSetupPacketLink()}
                disabled={setupPacketLoading}
              >
                {setupPacketLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create packet link
              </Button>
            </div>
            {setupPacketError && (
              <p role="alert" className="mt-3 text-sm text-destructive">{setupPacketError}</p>
            )}
            {setupPacket && (
              <div className="mt-4 space-y-2">
                <CodeSnippet
                  tabs={[
                    {
                      label: 'Packet URL',
                      code: setupPacket.packetUrl,
                      language: 'text',
                    },
                  ]}
                  wrap
                  maxHeightClassName="max-h-36"
                />
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(setupPacket.expiresAt).toLocaleString()}.
                </p>
              </div>
            )}
            <div className="mt-4 rounded-lg border bg-background/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Packet link status</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeSetupTokens.length > 0
                      ? `${activeSetupTokens.length} active setup ${activeSetupTokens.length === 1 ? 'link' : 'links'}`
                      : 'No active setup packet links.'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => void loadSetupTokens()}
                  disabled={setupTokensLoading}
                >
                  {setupTokensLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Refresh
                </Button>
              </div>
              {setupTokens.length > 0 && (
                <div className="mt-3 space-y-2">
                  {setupTokens.slice(0, 3).map((token) => {
                    const isActive = !token.revoked_at && new Date(token.expires_at).getTime() > Date.now()
                    return (
                      <div key={token.token_id} className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {isActive ? 'Active link' : token.revoked_at ? 'Revoked link' : 'Expired link'}
                          </p>
                          <p className="mt-0.5 text-muted-foreground">
                            Created {new Date(token.created_at).toLocaleString()} · Expires {new Date(token.expires_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 shrink-0 gap-1.5 text-xs text-destructive hover:text-destructive"
                          disabled={!isActive || revokingTokenId === token.token_id}
                          onClick={() => void revokeSetupToken(token.token_id)}
                        >
                          {revokingTokenId === token.token_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Revoke
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <CodeSnippet
            tabs={[
              {
                label: 'Agent Prompt',
                code: agentSetupPrompt,
                language: 'text',
              },
            ]}
            wrap
            maxHeightClassName="max-h-72"
          />
          <div className="divide-y rounded-lg border bg-muted/10">
            {[
              'Best for Cursor, Claude Code, Codex, Windsurf, or any repo-aware builder.',
              'The agent gets exact snippets instead of vague setup instructions.',
              'Verification stays explicit: one real test report must land in the inbox.',
            ].map((item) => (
              <div key={item} className="px-4 py-3 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </details>

      <details className="group rounded-lg border bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-base font-semibold text-foreground">Security and deployment hardening</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add CSP, SRI, or stronger human verification after the first test works.
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
                Public board submissions already use rate limiting. For the widget install, save captcha settings in <span className="font-medium text-foreground">Feedback form</span> if you need stronger protection on public forms.
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
            Verify the widget first. Add captcha only when the public form needs stronger abuse protection.
          </div>
        </div>
      </details>
    </div>
  )
}

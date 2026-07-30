'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/copy-button'
import type { Project } from '@/lib/types'
import { CodeSnippet } from '@/components/code-snippet'
import { PageHeader } from '@/components/ui/workspace-shell'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <CodeSnippet tabs={[{ label: language.toUpperCase(), code, language }]} maxHeightClassName="max-h-96" />
  )
}

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PATCH' }) {
  const className =
    method === 'POST'
      ? 'bg-emerald-600 text-white hover:bg-emerald-600'
      : method === 'PATCH'
        ? 'bg-amber-600 text-white hover:bg-amber-600'
        : 'bg-blue-600 text-white hover:bg-blue-600'

  return <Badge className={className}>{method}</Badge>
}

function EndpointExample({
  method,
  path,
  description,
  code,
  defaultOpen = false,
}: {
  method: 'GET' | 'POST' | 'PATCH'
  path: string
  description: string
  code: string
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group border-b last:border-b-0">
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-4 py-4 transition-colors hover:bg-accent/40 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MethodBadge method={method} />
            <code className="break-all font-mono text-sm">{path}</code>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-primary">
          <span className="group-open:hidden">Show curl</span>
          <span className="hidden group-open:inline">Hide curl</span>
        </span>
      </summary>
      <div className="border-t bg-muted/10 px-4 py-4">
        <CodeBlock code={code} />
      </div>
    </details>
  )
}

export function ApiDocs({
  project,
  projectKey,
  apiKeyLastFour,
  rotatingApiKey,
  onRotateApiKey,
}: {
  project: Project
  projectKey: string | null
  apiKeyLastFour: string | null
  rotatingApiKey: boolean
  onRotateApiKey: () => Promise<void>
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.feedbacks.dev'
  const mcpPackageUrl = `${baseUrl}/mcp/feedbacks-mcp-server-1.0.0.tgz`
  const exampleApiKey = projectKey || 'fb_live_YOUR_PRIVATE_KEY'
  const endpoints = [
    {
      method: 'GET' as const,
      path: '/api/v1/projects',
      description: 'List the project attached to this API key. API keys are scoped to one project.',
      code: `curl ${baseUrl}/api/v1/projects \\
  -H "X-API-Key: ${exampleApiKey}"`,
    },
    {
      method: 'POST' as const,
      path: '/api/v1/feedback',
      description: 'Submit feedback with optional structured data. Reusing the same Idempotency-Key safely returns the original 201 response.',
      code: `curl -X POST ${baseUrl}/api/v1/feedback \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${exampleApiKey}" \\
  -H "Idempotency-Key: feedback-REQUEST_UUID" \\
  -d '{
    "message": "Button click throws TypeError",
    "type": "bug",
    "priority": "high",
    "agent_name": "claude-code",
    "structured_data": {
      "stack_trace": "TypeError: Cannot read property...",
      "error_code": "ERR_NULL_REF",
      "component": "LoginForm"
    }
  }'

# 201 {"success":true,"id":"..."}
# 401 {"error":"Invalid or missing API key"}
# 409 when a key is reused with a different body`,
    },
    {
      method: 'GET' as const,
      path: '/api/v1/feedback',
      description: 'List feedback with pagination and filters for status, type, agent, search, page, and limit.',
      code: `curl ${baseUrl}/api/v1/feedback?status=new&limit=10 \\
  -H "X-API-Key: ${exampleApiKey}"`,
    },
    {
      method: 'GET' as const,
      path: '/api/v1/projects/{id}',
      description: 'Get project details and stats for the project attached to this API key.',
      code: `curl ${baseUrl}/api/v1/projects/${project.id} \\
  -H "X-API-Key: ${exampleApiKey}"`,
    },
    {
      method: 'PATCH' as const,
      path: '/api/v1/projects/{id}/feedback',
      description: 'Update feedback status, priority, or tags after triage.',
      code: `curl -X PATCH "${baseUrl}/api/v1/projects/${project.id}/feedback?feedback_id=FEEDBACK_ID" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${exampleApiKey}" \\
  -d '{"status": "in_progress", "priority": "high"}'`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={project.name}
        title="API and MCP"
        description="Use a private API key from a backend, script, or trusted agent. The browser embed uses a different publishable key."
      />

      <details className="group rounded-lg border bg-card shadow-[var(--shadow-card)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Limits and trust boundaries</p>
            <p className="mt-1 text-sm text-muted-foreground">Project scope, plan limits, rate limits, and webhook compatibility.</p>
          </div>
          <span className="text-xs font-medium text-primary group-open:hidden">Show</span>
          <span className="hidden text-xs font-medium text-primary group-open:inline">Hide</span>
        </summary>
        <div className="divide-y border-t bg-surface-raised/35">
          {[
            ['Project scope', 'Each API key can access only its attached project.'],
            ['Plan limits', 'Free access follows the shared Free plan quotas and history window; Pro removes the short history limit.'],
            ['Rate limits', 'Public submission paths are rate limited and return friendly errors instead of exposing internals.'],
            ['Pagination', 'List endpoints accept page and limit (maximum 100) and return total/page/limit metadata.'],
            ['Idempotency', 'Send a unique Idempotency-Key on feedback creation. Safe retries replay the original response; a different body with the same key returns 409.'],
            ['Key rotation', 'Generate a replacement private key here, update trusted clients, then revoke the old key. Publishable widget keys are unaffected.'],
            ['Permissions', 'Private keys are scoped to one project and explicit capabilities such as feedback:read and feedback:write.'],
            ['Webhook payloads', 'Generic webhooks include a version field. Current payload version: 2026-06-22.'],
            ['Linear', 'Use a signed generic webhook recipe when routing feedback into Linear.'],
          ].map(([label, body]) => (
            <div key={label} className="grid gap-1 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)]">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </details>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Connection details</CardTitle>
          <CardDescription>
            Private keys begin with `fb_live_`, are revealed once, and never belong in browser code.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y rounded-b-lg border-t p-0">
          <div className="grid gap-2 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-center">
            <p className="text-sm font-medium">API key</p>
            {projectKey ? (
              <code className="break-all rounded bg-muted px-2 py-1.5 font-mono text-sm">
                {projectKey}
              </code>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hidden{apiKeyLastFour ? `, ending in ${apiKeyLastFour}` : ''}. Generate a new private key to copy REST or MCP credentials.
              </p>
            )}
            {projectKey ? (
              <CopyButton value={projectKey} variant="outline" size="sm" />
            ) : (
              <Button variant="outline" size="sm" onClick={() => void onRotateApiKey()} disabled={rotatingApiKey}>
                {rotatingApiKey ? 'Generating' : 'Generate private key'}
              </Button>
            )}
          </div>
          <div className="grid gap-2 px-4 py-3 md:grid-cols-[160px_minmax(0,1fr)_auto] md:items-center">
            <p className="text-sm font-medium">Base URL</p>
            <code className="break-all rounded bg-muted px-2 py-1.5 font-mono text-sm">{baseUrl}/api/v1</code>
            <CopyButton value={`${baseUrl}/api/v1`} variant="outline" size="sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick start: submit feedback</CardTitle>
          <CardDescription>
            Use this from a backend, script, or trusted agent. {projectKey ? 'Do not expose this private key in public browser code.' : 'Generate a private key before copying a real command.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={endpoints.find((endpoint) => endpoint.path === '/api/v1/feedback' && endpoint.method === 'POST')?.code || ''} />
        </CardContent>
      </Card>

      <details className="group rounded-lg border bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-base font-semibold text-foreground">Endpoint reference</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open this when you need listing, project stats, or triage updates.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">
            <span className="group-open:hidden">Show endpoints</span>
            <span className="hidden group-open:inline">Hide endpoints</span>
          </span>
        </summary>
        <CardContent className="p-0">
          <div className="overflow-hidden border-t">
            {endpoints.map((endpoint, index) => (
              <EndpointExample key={endpoint.path + endpoint.method} {...endpoint} defaultOpen={index === 1} />
            ))}
          </div>
        </CardContent>
      </details>

      <details className="group rounded-lg border bg-card">
        <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-base font-semibold text-foreground">MCP server and agent tools</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect repo-aware agents to submit feedback, verify installs, and read setup packets.
            </p>
          </div>
          <span className="text-sm font-medium text-primary">
            <span className="group-open:hidden">Show MCP setup</span>
            <span className="hidden group-open:inline">Hide MCP setup</span>
          </span>
        </summary>
        <div className="space-y-4 border-t px-6 py-5">
          <p className="text-sm text-muted-foreground">
            Add this to your <code className="bg-muted px-1 rounded">.mcp.json</code> or Claude Code settings:
          </p>
          <CodeBlock language="json" code={`{
  "feedbacks": {
    "command": "npm",
    "args": ["exec", "--yes", "--package=${mcpPackageUrl}", "--", "feedbacks-mcp"],
    "env": {
      "FEEDBACKS_API_KEY": "${exampleApiKey}",
      "FEEDBACKS_API_URL": "${baseUrl}"
    }
  }
}`} />

          <div className="divide-y rounded-lg border bg-muted/10">
            {[
              ['submit_feedback', 'Submit a bug report or feature request.'],
              ['submit_test_feedback', 'Send a verification item to the inbox.'],
              ['list_projects', 'List the project attached to this API key.'],
              ['get_project_setup_packet', 'Fetch exact install snippets and verification steps.'],
              ['verify_widget_install', 'Inspect a reachable page and report inbox status.'],
              ['list_feedback', 'List recent feedback with filters.'],
              ['update_feedback_status', 'Change feedback status or priority.'],
              ['get_project_stats', 'Get project overview stats.'],
              ['search_feedback', 'Search feedback by keyword.'],
            ].map(([tool, description]) => (
              <div key={tool} className="grid gap-1 px-4 py-2.5 md:grid-cols-[220px_minmax(0,1fr)]">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">{tool}</code>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>

          <details className="rounded-lg border bg-muted/10">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Show example agent prompts</summary>
            <div className="border-t p-4">
            <CodeBlock code={`// In an AI agent conversation:
// "Submit a bug report about the login form crashing"
// → Agent calls submit_feedback with structured_data

// "Show me all open bugs"
// → Agent calls list_feedback with status=new, type=bug

// "Mark feedback abc-123 as in progress"
// → Agent calls update_feedback_status`} />
            </div>
          </details>
        </div>
      </details>
    </div>
  )
}

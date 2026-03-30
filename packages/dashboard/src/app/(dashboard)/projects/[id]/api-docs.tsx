'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/lib/types'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted rounded-lg p-4 pr-20 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
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

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/[0.04]">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Pro feature</Badge>
            <Badge variant="outline">REST + MCP</Badge>
          </div>
          <CardTitle className="mt-3 text-base">API and MCP access are part of Pro</CardTitle>
          <CardDescription>
            The widget, dashboard, and optional public board work on Free. Upgrade to Pro when you want programmatic feedback access, agent tooling, and the rest of the paid routing surface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/billing">
            <Button variant="outline" size="sm">Open Billing</Button>
          </Link>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Use this key in the X-API-Key header for all API requests</CardDescription>
        </CardHeader>
        <CardContent>
          {projectKey ? (
            <div className="flex items-center gap-3">
              <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                {projectKey}
              </code>
              <CopyButton text={projectKey} />
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-dashed bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">
                The current key is hidden by design{apiKeyLastFour ? ` and ends in ${apiKeyLastFour}` : ''}. Generate a fresh key to copy new REST or MCP credentials.
              </p>
              <Button variant="outline" size="sm" onClick={() => void onRotateApiKey()} disabled={rotatingApiKey}>
                {rotatingApiKey ? 'Generating…' : 'Generate fresh API key'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Base URL */}
      <Card>
        <CardHeader>
          <CardTitle>Base URL</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="bg-muted px-3 py-2 rounded text-sm font-mono">{baseUrl}/api/v1</code>
        </CardContent>
      </Card>

      {projectKey ? (
        <>
          {/* Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>REST API Endpoints</CardTitle>
              <CardDescription>All endpoints require the X-API-Key header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* POST /feedback */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">POST</Badge>
              <code className="text-sm font-mono">/api/v1/feedback</code>
            </div>
            <p className="text-sm text-muted-foreground">Submit feedback with optional structured data (stack traces, error codes, etc.)</p>
            <CodeBlock code={`curl -X POST ${baseUrl}/api/v1/feedback \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${projectKey}" \\
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
  }'`} />
          </div>

          {/* GET /feedback */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm font-mono">/api/v1/feedback</code>
            </div>
            <p className="text-sm text-muted-foreground">List feedback (paginated). Query params: status, type, agent_name, search, page, limit</p>
            <CodeBlock code={`curl ${baseUrl}/api/v1/feedback?status=new&limit=10 \\
  -H "X-API-Key: ${projectKey}"`} />
          </div>

          {/* GET /projects/:id */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">GET</Badge>
              <code className="text-sm font-mono">/api/v1/projects/{'{id}'}</code>
            </div>
            <p className="text-sm text-muted-foreground">Get project details with stats</p>
            <CodeBlock code={`curl ${baseUrl}/api/v1/projects/${project.id} \\
  -H "X-API-Key: ${projectKey}"`} />
          </div>

          {/* PATCH /projects/:id/feedback */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-600">PATCH</Badge>
              <code className="text-sm font-mono">/api/v1/projects/{'{id}'}/feedback?feedback_id=...</code>
            </div>
            <p className="text-sm text-muted-foreground">Update feedback status, priority, or tags</p>
            <CodeBlock code={`curl -X PATCH "${baseUrl}/api/v1/projects/${project.id}/feedback?feedback_id=FEEDBACK_ID" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${projectKey}" \\
  -d '{"status": "in_progress", "priority": "high"}'`} />
          </div>
            </CardContent>
          </Card>

          {/* MCP Server */}
          <Card>
            <CardHeader>
              <CardTitle>MCP Server (AI Agent Integration)</CardTitle>
              <CardDescription>
                Connect AI agents like Claude Code to your feedback board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add this to your <code className="bg-muted px-1 rounded">.mcp.json</code> or Claude Code settings:
          </p>
          <CodeBlock language="json" code={`{
  "feedbacks": {
    "command": "npx",
    "args": ["@feedbacks/mcp-server"],
    "env": {
      "FEEDBACKS_API_KEY": "${projectKey}",
      "FEEDBACKS_API_URL": "${baseUrl}"
    }
  }
}`} />

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available MCP Tools</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><code className="bg-muted px-1 rounded">submit_feedback</code> — Submit a bug report or feature request</li>
              <li><code className="bg-muted px-1 rounded">list_feedback</code> — List recent feedback (paginated, filterable)</li>
              <li><code className="bg-muted px-1 rounded">update_feedback_status</code> — Change feedback status/priority</li>
              <li><code className="bg-muted px-1 rounded">get_project_stats</code> — Get project overview stats</li>
              <li><code className="bg-muted px-1 rounded">search_feedback</code> — Search feedback by keyword</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Example Agent Usage</h4>
            <CodeBlock code={`// In an AI agent conversation:
// "Submit a bug report about the login form crashing"
// → Agent calls submit_feedback with structured_data

// "Show me all open bugs"
// → Agent calls list_feedback with status=new, type=bug

// "Mark feedback abc-123 as in progress"
// → Agent calls update_feedback_status`} />
          </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

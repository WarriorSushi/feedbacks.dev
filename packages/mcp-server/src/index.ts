#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  submitFeedbackParams,
  listFeedbackParams,
  updateFeedbackStatusParams,
  searchFeedbackParams,
} from './tools.js'

const API_KEY = process.env.FEEDBACKS_API_KEY
const API_URL = (process.env.FEEDBACKS_API_URL ?? 'https://app.feedbacks.dev').replace(/\/$/, '')

if (!API_KEY) {
  console.error('FEEDBACKS_API_KEY environment variable is required')
  process.exit(1)
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const url = `${API_URL}/api/v1${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY!,
      ...options.headers,
    },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? `API error: ${res.status}`)
  }
  return data
}

const server = new McpServer({
  name: 'feedbacks',
  version: '1.0.0',
})

// Cache project ID to avoid redundant API calls
let cachedProjectId: string | null = null

async function getProjectId(): Promise<string> {
  if (cachedProjectId) return cachedProjectId
  const projectRes = await apiRequest('/projects') as { data: { id: string }[] }
  const projectId = projectRes.data?.[0]?.id
  if (!projectId) throw new Error('No project found for this API key')
  cachedProjectId = projectId
  return projectId
}

server.tool(
  'submit_feedback',
  'Submit a bug report, feature request, or other feedback',
  submitFeedbackParams.shape,
  async (params) => {
    const result = await apiRequest('/feedback', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  }
)

server.tool(
  'list_feedback',
  'List recent feedback for the project',
  listFeedbackParams.shape,
  async (params) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.type) qs.set('type', params.type)
    if (params.search) qs.set('search', params.search)
    qs.set('limit', String(params.limit))
    qs.set('page', String(params.page))

    const result = await apiRequest(`/feedback?${qs.toString()}`)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  }
)

server.tool(
  'update_feedback_status',
  'Update the status, priority, or tags of a feedback item',
  updateFeedbackStatusParams.shape,
  async (params) => {
    const projectId = await getProjectId()

    const qs = new URLSearchParams({ feedback_id: params.feedback_id })
    const body: Record<string, unknown> = { status: params.status }
    if (params.priority) body.priority = params.priority
    if (params.tags) body.tags = params.tags

    const result = await apiRequest(`/projects/${projectId}/feedback?${qs.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  }
)

server.tool(
  'get_project_stats',
  'Get project overview with feedback statistics',
  {},
  async () => {
    const projectId = await getProjectId()

    const result = await apiRequest(`/projects/${projectId}`)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  }
)

server.tool(
  'search_feedback',
  'Search feedback by keyword with optional filters',
  searchFeedbackParams.shape,
  async (params) => {
    const qs = new URLSearchParams({
      search: params.query,
      limit: String(params.limit),
    })
    if (params.type) qs.set('type', params.type)
    if (params.status) qs.set('status', params.status)

    const result = await apiRequest(`/feedback?${qs.toString()}`)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('MCP server error:', err)
  process.exit(1)
})

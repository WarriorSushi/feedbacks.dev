import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { authenticateApiKey } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { deliverWebhooks } from '@/lib/webhook-delivery'
import type { FeedbackType, FeedbackPriority, FeedbackStatus, StructuredFeedbackData } from '@/lib/types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

const VALID_TYPES: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request, 'v1-feedback', 30, 1)
    if (!allowed) return jsonError('Too many requests', 429)

    const auth = await authenticateApiKey(request)
    if (!auth) return jsonError('Invalid or missing API key', 401)

    const body = await request.json()
    const { project } = auth

    // Validate message
    const message = body.message?.trim()
    if (!message || message.length < 2) return jsonError('Message must be at least 2 characters', 400)
    if (message.length > 5000) return jsonError('Message must be 5000 characters or less', 400)

    // Validate optional fields
    const type = body.type?.trim() as FeedbackType | undefined || null
    if (type && !VALID_TYPES.includes(type)) return jsonError('Invalid feedback type', 400)

    const priority = body.priority?.trim() as FeedbackPriority | undefined || null
    if (priority && !VALID_PRIORITIES.includes(priority)) return jsonError('Invalid priority', 400)

    const email = body.email?.trim() || null
    const url = body.url?.trim() || null
    const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 10) : []
    const agentName = body.agent_name?.trim() || null
    const agentSessionId = body.agent_session_id?.trim() || null
    const userAgent = body.user_agent || request.headers.get('user-agent') || ''

    // Validate structured_data size (max 10KB)
    const structuredData: StructuredFeedbackData | null = body.structured_data ?? null
    if (structuredData && JSON.stringify(structuredData).length > 10_240) {
      return jsonError('structured_data too large (max 10KB)', 400)
    }

    // Validate metadata size (max 4KB)
    const metadata = body.metadata ?? {}
    if (metadata && JSON.stringify(metadata).length > 4_096) {
      return jsonError('metadata too large (max 4KB)', 400)
    }

    const admin = await createAdminSupabase()
    const feedbackId = crypto.randomUUID()
    const now = new Date().toISOString()

    const feedbackRow = {
      id: feedbackId,
      project_id: project.id,
      message,
      email,
      url,
      user_agent: userAgent,
      type,
      rating: body.rating ?? null,
      priority,
      status: 'new' as const,
      tags,
      screenshot_url: null,
      attachments: null,
      metadata,
      is_archived: false,
      agent_name: agentName,
      agent_session_id: agentSessionId,
      structured_data: structuredData,
      created_at: now,
      updated_at: now,
    }

    const { error: insertErr } = await admin.from('feedback').insert(feedbackRow)
    if (insertErr) {
      console.error('Feedback insert error:', insertErr)
      return jsonError('Failed to save feedback', 500)
    }

    // Webhook delivery (best-effort)
    // NOTE: In Vercel production, use waitUntil() for reliable background execution
    if (project.webhooks) {
      deliverWebhooks(
        project.webhooks,
        feedbackRow,
        { id: project.id, name: project.name }
      ).catch(() => {})
    }

    return json({ success: true, id: feedbackId }, 201)
  } catch (err) {
    console.error('v1 feedback POST error:', err)
    return jsonError('Internal server error', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth) return jsonError('Invalid or missing API key', 401)

    const { project } = auth
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit

    const status = searchParams.get('status') as FeedbackStatus | null
    const type = searchParams.get('type') as FeedbackType | null
    const agentName = searchParams.get('agent_name')
    const search = searchParams.get('search')?.slice(0, 200) ?? null

    const admin = await createAdminSupabase()
    let query = admin
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })

    if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status)
    if (type && VALID_TYPES.includes(type)) query = query.eq('type', type)
    if (agentName) query = query.eq('agent_name', agentName)
    if (search) query = query.ilike('message', `%${search}%`)

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('v1 feedback GET error:', error)
      return jsonError('Failed to fetch feedback', 500)
    }

    return json({
      data: data ?? [],
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      pageSize: limit,
    })
  } catch (err) {
    console.error('v1 feedback GET error:', err)
    return jsonError('Internal server error', 500)
  }
}

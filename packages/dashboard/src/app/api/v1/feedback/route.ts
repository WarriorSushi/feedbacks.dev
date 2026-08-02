import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { authenticateApiKey } from '@/lib/api-auth'
import { assertCanReceiveFeedback, assertFeatureAccess, getBillingSummaryForUser, getHistoryCutoff, incrementFeedbackUsage } from '@/lib/billing'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'
import { checkRateLimit } from '@/lib/rate-limit'
import { enqueueWebhookJobs, processWebhookJobs } from '@/lib/webhook-delivery'
import { normalizeFeedbackMetadata } from '@/lib/feedback-submissions'
import type { FeedbackType, FeedbackPriority, FeedbackStatus, StructuredFeedbackData } from '@/lib/types'
import { readJsonBody } from '@/lib/api-request'
import { apiV1Error } from '@/lib/api-v1-response'
import {
  decodeFeedbackCursor,
  feedbackCursorFilter,
  nextFeedbackCursor,
} from '@/lib/cursor-pagination'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Idempotency-Key',
  'Access-Control-Expose-Headers': 'Idempotency-Replayed, Retry-After',
}

const VALID_TYPES: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']

type CreateFeedbackBody = {
  message?: string
  type?: string
  priority?: string
  email?: string
  url?: string
  rating?: number
  tags?: unknown[]
  agent_name?: string
  agent_session_id?: string
  user_agent?: string
  structured_data?: StructuredFeedbackData | null
  metadata?: unknown
}
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(data: unknown, status = 200, additionalHeaders: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { ...CORS_HEADERS, ...additionalHeaders } })
}

function jsonError(message: string, status: number) {
  return apiV1Error(message, status, CORS_HEADERS)
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest) {
  try {
    const { allowed } = await checkRateLimit(request, 'v1-feedback', 30, 1)
    if (!allowed) return apiV1Error('Too many requests. Try again in a minute.', 429, { ...CORS_HEADERS, 'Retry-After': '60' })

    const auth = await authenticateApiKey(request, 'feedback:write')
    if (!auth) return jsonError('Invalid or missing API key', 401)
    const scopedRate = await checkRateLimit(request, 'v1-feedback-project', 60, 1, auth.project.id)
    if (!scopedRate.allowed) return apiV1Error('Project request limit reached. Try again in a minute.', 429, { ...CORS_HEADERS, 'Retry-After': '60' })

    const bodyResult = await readJsonBody<CreateFeedbackBody>(request)
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
    const { project } = auth
    const feature = await assertFeatureAccess(project.owner_user_id, 'apiAccess')
    if (!feature.allowed) return jsonError(feature.message, 403)

    const entitlement = await assertCanReceiveFeedback(project.owner_user_id)
    if (!entitlement.allowed) {
      return jsonError(entitlement.message, 403)
    }

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
    if (email && !EMAIL_RE.test(email)) return jsonError('Invalid email format', 400)

    const url = body.url?.trim() || null
    if (url) {
      try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return jsonError('URL must use http or https protocol', 400)
        }
      } catch {
        return jsonError('Invalid URL', 400)
      }
    }

    const rating = body.rating ?? null
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return jsonError('Rating must be an integer from 1 to 5', 400)
    }

    const tags: string[] = Array.isArray(body.tags)
      ? Array.from(
        new Set<string>(
          body.tags
            .map((tag: unknown) => String(tag).trim())
            .filter((tag: string) => tag.length > 0),
        ),
      ).slice(0, 10)
      : []
    const agentName = body.agent_name?.trim() || null
    const agentSessionId = body.agent_session_id?.trim() || null
    const userAgent = body.user_agent || request.headers.get('user-agent') || ''

    // Validate structured_data size (max 10KB)
    const structuredData: StructuredFeedbackData | null = body.structured_data ?? null
    if (structuredData && JSON.stringify(structuredData).length > 10_240) {
      return jsonError('structured_data too large (max 10KB)', 400)
    }

    // Validate metadata size (max 4KB)
    const metadata = normalizeFeedbackMetadata(body.metadata)
    if (metadata && JSON.stringify(metadata).length > 4_096) {
      return jsonError('metadata too large (max 4KB)', 400)
    }

    const admin = await createAdminSupabase()
    const idempotencyKey = request.headers.get('idempotency-key')?.trim() || null
    let idempotencyKeyHash: string | null = null
    const requestHash = await sha256(JSON.stringify(canonicalize(body)))
    if (idempotencyKey) {
      if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
        return jsonError('Idempotency-Key must be 8–128 URL-safe characters', 400)
      }
      idempotencyKeyHash = await sha256(idempotencyKey)
      await admin
        .from('api_idempotency_keys')
        .delete()
        .eq('project_id', project.id)
        .eq('route', 'POST /api/v1/feedback')
        .lt('expires_at', new Date().toISOString())
      const { error: claimError } = await admin.from('api_idempotency_keys').insert({
        project_id: project.id,
        route: 'POST /api/v1/feedback',
        key_hash: idempotencyKeyHash,
        request_hash: requestHash,
        status: 'processing',
      })
      if (claimError) {
        if (claimError.code !== '23505') {
          return jsonError('The idempotent request could not be reserved. Try again.', 503)
        }
        const { data: existing } = await admin
          .from('api_idempotency_keys')
          .select('request_hash,status,response_status,response_body')
          .eq('project_id', project.id)
          .eq('route', 'POST /api/v1/feedback')
          .eq('key_hash', idempotencyKeyHash)
          .maybeSingle()
        if (!existing) return jsonError('The prior request state could not be loaded. Try again.', 503)
        if (existing.request_hash !== requestHash) {
          return jsonError('This Idempotency-Key was already used with a different request body', 409)
        }
        if (existing.status === 'completed' && existing.response_status && existing.response_body) {
          return json(existing.response_body, existing.response_status, { 'Idempotency-Replayed': 'true' })
        }
        return apiV1Error(
          'A request with this Idempotency-Key is still processing',
          409,
          { ...CORS_HEADERS, 'Retry-After': '2' },
        )
      }
    }
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
      rating,
      priority,
      status: 'new' as const,
      tags,
      screenshot_url: null,
      attachments: null,
      metadata: { ...metadata, source: 'api' },
      is_public: false,
      is_archived: false,
      read_at: null,
      agent_name: agentName,
      agent_session_id: agentSessionId,
      structured_data: structuredData,
      created_at: now,
      updated_at: now,
    }

    const { error: insertErr } = await admin.from('feedback').insert(feedbackRow)
    if (insertErr) {
      console.error('Feedback insert error:', insertErr)
      if (idempotencyKeyHash) {
        await admin
          .from('api_idempotency_keys')
          .delete()
          .eq('project_id', project.id)
          .eq('route', 'POST /api/v1/feedback')
          .eq('key_hash', idempotencyKeyHash)
      }
      return jsonError('Failed to save feedback', 500)
    }

    await incrementFeedbackUsage(project.owner_user_id)

    // Queue webhook delivery so retries survive the request lifecycle.
    if (project.webhooks) {
      enqueueWebhookJobs(
        project.webhooks,
        feedbackRow,
        { id: project.id, name: project.name },
        'feedback.new',
        entitlement.summary.entitlements.webhookEndpointLimit,
      )
        .then((jobIds) => {
          if (jobIds.length > 0) {
            void processWebhookJobs({ jobIds, limit: jobIds.length })
          }
        })
        .catch(() => {})
    }

    void notifyProjectOwnerOfNewFeedback(
      { id: project.id, name: project.name, owner_user_id: project.owner_user_id },
      {
        message: feedbackRow.message,
        type: feedbackRow.type,
        email: feedbackRow.email,
        url: feedbackRow.url,
        rating: feedbackRow.rating,
        created_at: feedbackRow.created_at,
      },
    )

    const responseBody = { success: true, id: feedbackId }
    if (idempotencyKeyHash) {
      await admin
        .from('api_idempotency_keys')
        .update({ status: 'completed', response_status: 201, response_body: responseBody })
        .eq('project_id', project.id)
        .eq('route', 'POST /api/v1/feedback')
        .eq('key_hash', idempotencyKeyHash)
    }
    return json(responseBody, 201, { 'Idempotency-Replayed': 'false' })
  } catch (err) {
    console.error('v1 feedback POST error:', err)
    return jsonError('Internal server error', 500)
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request, 'feedback:read')
    if (!auth) return jsonError('Invalid or missing API key', 401)

    const { project } = auth
    const feature = await assertFeatureAccess(project.owner_user_id, 'apiAccess')
    if (!feature.allowed) return jsonError(feature.message, 403)
    const { searchParams } = new URL(request.url)

    const legacyPageValue = searchParams.get('page')
    const page = Math.max(1, parseInt(legacyPageValue ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const offset = (page - 1) * limit
    const cursorValue = searchParams.get('cursor')
    const cursor = decodeFeedbackCursor(cursorValue)
    if (cursorValue && !cursor) return jsonError('Invalid pagination cursor', 400)

    const status = searchParams.get('status') as FeedbackStatus | null
    const type = searchParams.get('type') as FeedbackType | null
    const agentName = searchParams.get('agent_name')
    const search = searchParams.get('search')?.slice(0, 200) ?? null

    const admin = await createAdminSupabase()
    const summary = await getBillingSummaryForUser(project.owner_user_id)
    const historyCutoff = getHistoryCutoff(summary)
    let query = admin
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status)
    if (type && VALID_TYPES.includes(type)) query = query.eq('type', type)
    if (agentName) query = query.eq('agent_name', agentName)
    if (search) query = query.ilike('message', `%${search}%`)
    if (historyCutoff) query = query.gte('created_at', historyCutoff)
    if (cursor) query = query.or(feedbackCursorFilter(cursor))

    const result = cursor || !legacyPageValue
      ? await query.limit(limit + 1)
      : await query.range(offset, offset + limit - 1)
    const { data, count, error } = result

    if (error) {
      console.error('v1 feedback GET error:', error)
      return jsonError('Failed to fetch feedback', 500)
    }

    const rows = data ?? []
    const hasMore = cursor || !legacyPageValue ? rows.length > limit : page * limit < (count ?? 0)
    const pageRows = rows.slice(0, limit)
    return json({
      data: pageRows,
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      pageSize: limit,
      nextCursor: nextFeedbackCursor(pageRows, hasMore),
      hasMore,
      pagination: legacyPageValue ? 'offset-deprecated' : 'cursor',
    })
  } catch (err) {
    console.error('v1 feedback GET error:', err)
    return jsonError('Internal server error', 500)
  }
}

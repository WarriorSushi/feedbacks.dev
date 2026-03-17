import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { authenticateApiKey } from '@/lib/api-auth'
import type { FeedbackType, FeedbackStatus, FeedbackPriority } from '@/lib/types'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
}

const VALID_TYPES: FeedbackType[] = ['bug', 'idea', 'praise', 'question']
const VALID_STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']
const VALID_PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(request)
    if (!auth) return jsonError('Invalid or missing API key', 401)
    if (auth.project.id !== id) return jsonError('Forbidden', 403)

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
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (status && VALID_STATUSES.includes(status)) query = query.eq('status', status)
    if (type && VALID_TYPES.includes(type)) query = query.eq('type', type)
    if (agentName) query = query.eq('agent_name', agentName)
    if (search) query = query.ilike('message', `%${search}%`)

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) return jsonError('Failed to fetch feedback', 500)

    return json({
      data: data ?? [],
      count: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      pageSize: limit,
    })
  } catch (err) {
    console.error('v1 project feedback GET error:', err)
    return jsonError('Internal server error', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(request)
    if (!auth) return jsonError('Invalid or missing API key', 401)
    if (auth.project.id !== id) return jsonError('Forbidden', 403)

    const { searchParams } = new URL(request.url)
    const feedbackId = searchParams.get('feedback_id')
    if (!feedbackId) return jsonError('feedback_id query param is required', 400)

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) return jsonError('Invalid status', 400)
      updates.status = body.status
      if (body.status === 'closed') updates.resolved_at = new Date().toISOString()
    }
    if (body.priority) {
      if (!VALID_PRIORITIES.includes(body.priority)) return jsonError('Invalid priority', 400)
      updates.priority = body.priority
    }
    if (body.tags && Array.isArray(body.tags)) {
      updates.tags = body.tags.map(String).slice(0, 10)
    }

    if (Object.keys(updates).length === 0) return jsonError('No valid fields to update', 400)
    updates.updated_at = new Date().toISOString()

    const admin = await createAdminSupabase()
    const { data, error } = await admin
      .from('feedback')
      .update(updates)
      .eq('id', feedbackId)
      .eq('project_id', id)
      .select()
      .single()

    if (error || !data) return jsonError('Feedback not found', 404)

    return json({ data })
  } catch (err) {
    console.error('v1 project feedback PATCH error:', err)
    return jsonError('Internal server error', 500)
  }
}

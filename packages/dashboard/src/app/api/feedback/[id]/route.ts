import { NextRequest, NextResponse } from 'next/server'
import type { FeedbackPriority, FeedbackStatus } from '@feedbacks/shared'
import { readJsonBody } from '@/lib/api-request'
import {
  editConflictResponse,
  formatVersionEtag,
  parseIfMatchVersion,
} from '@/lib/optimistic-concurrency'
import { createServerSupabase } from '@/lib/supabase-server'

const STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']
const PRIORITIES: FeedbackPriority[] = ['low', 'medium', 'high', 'critical']

type FeedbackPatch = {
  status?: FeedbackStatus
  priority?: FeedbackPriority
  tags?: string[]
  isArchived?: boolean
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bodyResult = await readJsonBody<FeedbackPatch>(request)
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
  const allowed = new Set(['status', 'priority', 'tags', 'isArchived'])
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return NextResponse.json({ error: 'Unsupported feedback change.' }, { status: 400 })
  }

  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  const { data: current } = await supabase
    .from('feedback')
    .select('id, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (!current) return NextResponse.json({ error: 'Feedback not found.' }, { status: 404 })
  if (!expectedVersion) {
    return NextResponse.json(
      {
        code: 'PRECONDITION_REQUIRED',
        error: 'Reload this feedback item before saving so newer changes are not overwritten.',
      },
      { status: 428, headers: { ETag: formatVersionEtag(current.updated_at) } },
    )
  }
  if (expectedVersion !== current.updated_at) {
    return NextResponse.json(editConflictResponse(current.updated_at), {
      status: 409,
      headers: { ETag: formatVersionEtag(current.updated_at) },
    })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Choose a valid feedback status.' }, { status: 400 })
    }
    updates.status = body.status
    updates.resolved_at = body.status === 'closed' ? new Date().toISOString() : null
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: 'Choose a valid priority.' }, { status: 400 })
    }
    updates.priority = body.priority
  }
  if (body.tags !== undefined) {
    if (
      !Array.isArray(body.tags)
      || body.tags.length > 10
      || body.tags.some((tag) => typeof tag !== 'string' || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(tag))
      || new Set(body.tags).size !== body.tags.length
    ) {
      return NextResponse.json({ error: 'Use up to 10 unique lowercase tags.' }, { status: 400 })
    }
    updates.tags = body.tags
  }
  if (body.isArchived !== undefined) updates.is_archived = body.isArchived
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No supported feedback changes were provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedback')
    .update(updates)
    .eq('id', id)
    .eq('updated_at', expectedVersion)
    .select('id, status, priority, tags, is_archived, updated_at')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to save feedback.' }, { status: 500 })
  if (!data) {
    const { data: latest } = await supabase
      .from('feedback')
      .select('updated_at')
      .eq('id', id)
      .maybeSingle()
    const currentVersion = latest?.updated_at || current.updated_at
    return NextResponse.json(editConflictResponse(currentVersion), {
      status: 409,
      headers: { ETag: formatVersionEtag(currentVersion) },
    })
  }

  return NextResponse.json(data, {
    headers: { ETag: formatVersionEtag(data.updated_at) },
  })
}

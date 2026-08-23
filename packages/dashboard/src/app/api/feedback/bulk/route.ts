import { NextRequest, NextResponse } from 'next/server'
import type { FeedbackStatus } from '@feedbacks/shared'
import { readJsonBody } from '@/lib/api-request'
import { cleanupFeedbackStorageForFeedbackIds } from '@/lib/feedback-storage-cleanup'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'

const STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'planned', 'in_progress', 'closed']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/
const MAX_BULK_ITEMS = 100

type BulkFeedbackRequest = {
  ids?: string[]
  status?: FeedbackStatus
  readState?: 'read' | 'unread'
  tag?: {
    action?: 'add' | 'remove'
    value?: string
  }
}

type OwnedFeedback = {
  id: string
  project_id: string
  status: FeedbackStatus
  tags: string[] | null
  read_at: string | null
  updated_at: string
}

function parseIds(value: unknown) {
  if (!Array.isArray(value)) return null
  const ids = Array.from(new Set(value))
  if (
    ids.length === 0
    || ids.length > MAX_BULK_ITEMS
    || ids.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))
  ) return null
  return ids as string[]
}

async function getOwnedFeedback(ids: string[]) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const { data, error } = await supabase
    .from('feedback')
    .select('id, project_id, status, tags, read_at, updated_at')
    .in('id', ids)

  if (error) {
    return { response: NextResponse.json({ error: 'Unable to load the selected feedback.' }, { status: 500 }) }
  }
  const feedback = (data || []) as OwnedFeedback[]
  return {
    supabase,
    feedback,
    skippedCount: Math.max(0, ids.length - feedback.length),
  }
}

export async function PATCH(request: NextRequest) {
  const bodyResult = await readJsonBody<BulkFeedbackRequest>(request)
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
  const allowed = new Set(['ids', 'status', 'readState', 'tag'])
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return NextResponse.json({ error: 'Unsupported bulk feedback change.' }, { status: 400 })
  }
  const ids = parseIds(body.ids)
  if (!ids) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_BULK_ITEMS} valid feedback items.` }, { status: 400 })
  }

  const actionCount = Number(body.status !== undefined)
    + Number(body.readState !== undefined)
    + Number(body.tag !== undefined)
  if (actionCount !== 1) {
    return NextResponse.json({ error: 'Choose exactly one bulk action.' }, { status: 400 })
  }

  const owned = await getOwnedFeedback(ids)
  if ('response' in owned) return owned.response
  const { supabase, feedback } = owned
  const targetIds = feedback.map((item) => item.id)
  const now = new Date().toISOString()

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Choose a valid feedback status.' }, { status: 400 })
    }
    if (targetIds.length === 0) {
      return NextResponse.json({ feedback: [], skippedCount: ids.length })
    }
    const { data, error } = await supabase
      .from('feedback')
      .update({
        status: body.status,
        resolved_at: body.status === 'closed' ? now : null,
        updated_at: now,
      })
      .in('id', targetIds)
      .select('id, project_id, status, tags, read_at, updated_at')

    if (error) {
      return NextResponse.json({ error: 'The selected statuses could not be updated.' }, { status: 500 })
    }
    const changed = data || []
    return NextResponse.json({ feedback: changed, skippedCount: Math.max(0, ids.length - changed.length) })
  }

  if (body.readState !== undefined) {
    if (body.readState !== 'read' && body.readState !== 'unread') {
      return NextResponse.json({ error: 'Choose read or unread.' }, { status: 400 })
    }
    if (targetIds.length === 0) {
      return NextResponse.json({ feedback: [], skippedCount: ids.length })
    }
    const { data, error } = await supabase
      .from('feedback')
      .update({ read_at: body.readState === 'read' ? now : null })
      .in('id', targetIds)
      .select('id, project_id, status, tags, read_at, updated_at')

    if (error) {
      return NextResponse.json({ error: 'The selected read state could not be updated.' }, { status: 500 })
    }
    const changed = data || []
    return NextResponse.json({ feedback: changed, skippedCount: Math.max(0, ids.length - changed.length) })
  }

  const tagAction = body.tag?.action
  const tagValue = body.tag?.value?.trim().toLowerCase()
  if ((tagAction !== 'add' && tagAction !== 'remove') || !tagValue || !TAG_PATTERN.test(tagValue)) {
    return NextResponse.json({ error: 'Use a valid lowercase tag up to 32 characters.' }, { status: 400 })
  }
  if (feedback.length === 0) {
    return NextResponse.json({ feedback: [], skippedCount: ids.length })
  }

  const updates = await Promise.all(feedback.map(async (item) => {
    const currentTags = Array.from(new Set((item.tags || []).filter((tag): tag is string => typeof tag === 'string')))
    const nextTags = tagAction === 'add'
      ? Array.from(new Set([...currentTags, tagValue])).slice(0, 10)
      : currentTags.filter((tag) => tag !== tagValue)
    return supabase
      .from('feedback')
      .update({ tags: nextTags, updated_at: now })
      .eq('id', item.id)
      .select('id, project_id, status, tags, read_at, updated_at')
      .single()
  }))
  const failedUpdate = updates.find((result) => result.error && result.error.code !== 'PGRST116')
  if (failedUpdate) {
    return NextResponse.json({ error: 'The tag change could not be applied.' }, { status: 500 })
  }

  const changed = updates.flatMap((result) => result.data ? [result.data] : [])
  return NextResponse.json({ feedback: changed, skippedCount: Math.max(0, ids.length - changed.length) })
}

export async function DELETE(request: NextRequest) {
  const bodyResult = await readJsonBody<BulkFeedbackRequest>(request)
  if (!bodyResult.ok) return bodyResult.response
  if (Object.keys(bodyResult.data).some((key) => key !== 'ids')) {
    return NextResponse.json({ error: 'Only feedback ids can be deleted.' }, { status: 400 })
  }
  const ids = parseIds(bodyResult.data.ids)
  if (!ids) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_BULK_ITEMS} valid feedback items.` }, { status: 400 })
  }

  const owned = await getOwnedFeedback(ids)
  if ('response' in owned) return owned.response
  const targetIds = owned.feedback.map((item) => item.id)

  // Deletion is intentionally idempotent. A cached inbox, another tab, or a
  // teammate may have removed part of the selection already. Those rows are
  // stale UI, not a reason to reject the remaining valid deletion.
  if (targetIds.length === 0) {
    return NextResponse.json({ deletedIds: [], skippedCount: ids.length })
  }

  const admin = await createAdminSupabase()
  try {
    await cleanupFeedbackStorageForFeedbackIds(admin, targetIds)
  } catch {
    return NextResponse.json({ error: 'Feedback media could not be removed. Nothing was deleted.' }, { status: 500 })
  }

  const { data, error } = await admin
    .from('feedback')
    .delete()
    .in('id', targetIds)
    .select('id')

  if (error) {
    return NextResponse.json({ error: 'The selected feedback could not be deleted.' }, { status: 500 })
  }

  const deletedIds = (data || []).map((item) => item.id)
  return NextResponse.json({
    deletedIds,
    skippedCount: Math.max(0, ids.length - deletedIds.length),
  })
}

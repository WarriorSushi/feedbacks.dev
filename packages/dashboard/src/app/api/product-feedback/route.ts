import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'
import { mapProductUpdate, publicImageUrl } from '@/lib/product-update-service'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'
import type { FeedbackType } from '@feedbacks/shared'

const VALID_TYPES = new Set<FeedbackType>(['bug', 'idea', 'question', 'praise'])

async function getInternalProject(admin: Awaited<ReturnType<typeof createAdminSupabase>>) {
  const { data, error } = await admin
    .from('projects')
    .select('id,name,owner_user_id')
    .contains('settings', { internal_feedback_project: true })
    .maybeSingle()
  if (error) throw error
  return data
}
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminSupabase()
    const project = await getInternalProject(admin)
    if (!project) return NextResponse.json({ updates: [] })

    const now = new Date().toISOString()
    const { data, error } = await admin
      .from('product_updates')
      .select('*')
      .eq('project_id', project.id)
      .eq('status', 'published')
      .lte('published_at', now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('published_at', { ascending: false })
      .limit(5)
    if (error) throw error

    return NextResponse.json({
      updates: (data || []).map((row) => mapProductUpdate(
        row,
        publicImageUrl(admin, row.image_path),
      )),
    })
  } catch {
    return NextResponse.json({ error: 'Product updates are temporarily unavailable.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rate = await checkRateLimit(request, 'product-feedback', 5, 10, user.id)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'You have sent several notes recently. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': '600' } },
      )
    }

    const bodyResult = await readJsonBody<{ message?: string; type?: string }>(request, { maxBytes: 8_192 })
    if (!bodyResult.ok) return bodyResult.response
    const message = bodyResult.data.message?.trim() || ''
    const type = bodyResult.data.type?.trim() as FeedbackType | undefined
    if (message.length < 2 || message.length > 2_000) {
      return NextResponse.json({ error: 'Write between 2 and 2,000 characters.' }, { status: 400 })
    }
    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: 'Choose a feedback type.' }, { status: 400 })
    }

    const admin = await createAdminSupabase()
    const project = await getInternalProject(admin)
    if (!project) {
      return NextResponse.json(
        { error: 'The product feedback inbox is not configured yet.' },
        { status: 503 },
      )
    }

    const now = new Date().toISOString()
    const feedback = {
      id: crypto.randomUUID(),
      project_id: project.id,
      message,
      email: user.email || null,
      url: `${request.nextUrl.origin}/settings`,
      user_agent: request.headers.get('user-agent') || 'feedbacks.dev dashboard',
      type,
      priority: 'low' as const,
      status: 'new' as const,
      tags: ['feedbacks.dev', 'in-app'],
      metadata: { source: 'internal_settings', submitter_user_id: user.id },
      is_public: false,
      is_archived: false,
      read_at: null,
      created_at: now,
      updated_at: now,
    }
    const { error } = await admin.from('feedback').insert(feedback)
    if (error) throw error

    void notifyProjectOwnerOfNewFeedback(
      project,
      { message, type, email: user.email || null, url: feedback.url, rating: null, created_at: now },
    )

    return NextResponse.json({ success: true, id: feedback.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Your feedback could not be sent. Please try again.' }, { status: 500 })
  }
}

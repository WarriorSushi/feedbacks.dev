import { after, NextRequest, NextResponse } from 'next/server'
import { readJsonBody } from '@/lib/api-request'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { submitEarlyAdopterFeedback } from '@/lib/early-adopter'
import { notifyProjectOwnerOfNewFeedback } from '@/lib/notifications'

type FeedbackBody = {
  good?: string
  bad?: string
  improve?: string
  anythingElse?: string
}

function validateField(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.length >= 3 && text.length <= 2_000 ? text : null
}

async function copyToProductInbox(input: {
  request: NextRequest
  userId: string
  email?: string | null
  month: number
  good: string
  bad: string
  improve: string
  anythingElse: string
}) {
  try {
    const admin = await createAdminSupabase()
    const { data: project } = await admin
      .from('projects')
      .select('id,name,owner_user_id')
      .contains('settings', { internal_feedback_project: true })
      .maybeSingle()
    if (!project) return

    const message = [
      `Early Adopter Programme check-in for Pro month ${input.month} of 12`,
      `What is good:\n${input.good}`,
      `What is bad:\n${input.bad}`,
      `What should improve:\n${input.improve}`,
      input.anythingElse ? `Anything else:\n${input.anythingElse}` : null,
    ].filter(Boolean).join('\n\n')
    const now = new Date().toISOString()
    const feedback = {
      id: crypto.randomUUID(),
      project_id: project.id,
      message,
      email: input.email || null,
      url: `${input.request.nextUrl.origin}/early-adopter`,
      user_agent: input.request.headers.get('user-agent') || 'feedbacks.dev dashboard',
      type: 'idea' as const,
      priority: 'medium' as const,
      status: 'new' as const,
      tags: ['feedbacks.dev', 'early-adopter', `month-${input.month}`],
      metadata: { source: 'early_adopter_programme', submitter_user_id: input.userId, programme_month: input.month },
      is_public: false,
      is_archived: false,
      read_at: null,
      created_at: now,
      updated_at: now,
    }
    const { error } = await admin.from('feedback').insert(feedback)
    if (error) return
    after(() => notifyProjectOwnerOfNewFeedback(
      project,
      { message, type: 'idea', email: input.email || null, url: feedback.url, rating: null, created_at: now },
    ))
  } catch {
    // The programme record is authoritative. Inbox mirroring must not undo a renewal.
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to submit your programme check-in.' }, { status: 401 })

  const rate = await checkRateLimit(request, 'early-adopter-feedback', 4, 10, user.id)
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Please wait a few minutes before trying again.' }, { status: 429 })
  }

  const bodyResult = await readJsonBody<FeedbackBody>(request, { maxBytes: 10_000 })
  if (!bodyResult.ok) return bodyResult.response
  const good = validateField(bodyResult.data.good)
  const bad = validateField(bodyResult.data.bad)
  const improve = validateField(bodyResult.data.improve)
  const anythingElse = typeof bodyResult.data.anythingElse === 'string' ? bodyResult.data.anythingElse.trim().slice(0, 2_000) : ''
  if (!good || !bad || !improve) {
    return NextResponse.json({
      error: 'Complete all three check-in questions with at least three characters each.',
    }, { status: 400 })
  }

  try {
    const result = await submitEarlyAdopterFeedback({ userId: user.id, good, bad, improve, anythingElse })
    if (!result.renewed) {
      const messages: Record<string, string> = {
        feedback_not_open: 'Your next feedback window has not opened yet.',
        onboarding_incomplete: 'Complete the guided onboarding before the first renewal.',
        grace_expired: 'The two-month grace period has ended and this programme membership is closed.',
        programme_complete: 'You have already earned all 12 programme months.',
        already_submitted: 'This monthly check-in has already been submitted.',
      }
      return NextResponse.json({ error: messages[result.reason || ''] || 'This check-in cannot be renewed right now.', reason: result.reason }, { status: 409 })
    }

    void copyToProductInbox({
      request,
      userId: user.id,
      email: user.email,
      month: result.proMonthsEarned || 1,
      good,
      bad,
      improve,
      anythingElse,
    })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Your feedback could not be saved. Please try again.' }, { status: 500 })
  }
}

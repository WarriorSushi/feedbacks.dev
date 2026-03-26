import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { isBoardPubliclyAccessible } from '@/lib/public-board'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function buildReporterIdentifier(request: NextRequest, userId: string | null) {
  if (userId) return `user:${userId}`

  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'

  const encoded = new TextEncoder().encode(`${ip}:${process.env.BOARD_REPORT_SALT || '_feedbacks_board_report'}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const { allowed } = await checkRateLimit(request, 'board-report', 10, 10)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many reports. Please wait a bit and try again.' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  const details = typeof body.details === 'string' ? body.details.trim() : ''
  const feedbackId = typeof body.feedback_id === 'string' ? body.feedback_id : null
  const reporterEmail = typeof body.email === 'string' ? body.email.trim() : ''

  if (!reason || reason.length > 160) {
    return NextResponse.json({ error: 'Please share a short reason (1-160 characters).' }, { status: 400 })
  }

  if (details.length > 2000) {
    return NextResponse.json({ error: 'Report details are too long.' }, { status: 400 })
  }

  if (reporterEmail && !EMAIL_RE.test(reporterEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address or leave it blank.' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = await createAdminSupabase()

  const { data: board } = await admin
    .from('public_board_settings')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .single()

  if (!board || !isBoardPubliclyAccessible(board)) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 })
  }

  let targetType: 'board' | 'feedback' = 'board'
  if (feedbackId) {
    const { data: feedback } = await admin
      .from('feedback')
      .select('id')
      .eq('id', feedbackId)
      .eq('project_id', board.project_id)
      .eq('is_public', true)
      .single()

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    targetType = 'feedback'
  }

  const reporterIdentifier = await buildReporterIdentifier(request, user?.id || null)
  const { data: existing } = await admin
    .from('board_reports')
    .select('id')
    .eq('board_id', board.id)
    .eq('feedback_id', feedbackId)
    .eq('reporter_identifier', reporterIdentifier)
    .eq('status', 'open')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, reportId: existing.id })
  }

  const { data: report, error } = await admin
    .from('board_reports')
    .insert({
      board_id: board.id,
      project_id: board.project_id,
      feedback_id: feedbackId,
      user_id: user?.id || null,
      reporter_identifier: reporterIdentifier,
      reporter_email: reporterEmail || null,
      target_type: targetType,
      reason,
      details: details || null,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !report) {
    return NextResponse.json({ error: error?.message || 'Failed to save report' }, { status: 500 })
  }

  return NextResponse.json({ success: true, reportId: report.id }, { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { HOSTED_VERIFICATION_SUBMISSION_CONTEXT } from '@feedbacks/shared'

const MAX_VERIFICATION_WINDOW_MS = 2 * 60 * 60 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error

  const sinceValue = request.nextUrl.searchParams.get('since')
  const sinceTime = sinceValue ? Date.parse(sinceValue) : Number.NaN
  if (!Number.isFinite(sinceTime)) {
    return NextResponse.json(
      { error: 'A valid verification start time is required.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const boundedSince = new Date(Math.max(sinceTime, Date.now() - MAX_VERIFICATION_WINDOW_MS)).toISOString()
  const { data, error } = await auth.admin
    .from('feedback')
    .select('id, created_at, url, metadata')
    .eq('project_id', id)
    .gte('created_at', boundedSince)
    .not('url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json(
      { error: 'Unable to check for a test submission.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const productFeedback = data?.find((feedback) => {
    const metadata = feedback.metadata && typeof feedback.metadata === 'object'
      ? feedback.metadata as Record<string, unknown>
      : null
    return metadata?.submission_context !== HOSTED_VERIFICATION_SUBMISSION_CONTEXT
  })

  return NextResponse.json(
    {
      feedback: productFeedback
        ? { id: productFeedback.id, createdAt: productFeedback.created_at, url: productFeedback.url }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

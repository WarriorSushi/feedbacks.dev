import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'

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
    .select('id, created_at, url')
    .eq('project_id', id)
    .gte('created_at', boundedSince)
    .not('url', 'is', null)
    .not('url', 'ilike', `%/projects/${id}/verify%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: 'Unable to check for a test submission.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    {
      feedback: data
        ? { id: data.id, createdAt: data.created_at, url: data.url }
        : null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

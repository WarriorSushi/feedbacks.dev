import { NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error

  const { count, error } = await auth.admin
    .from('feedback')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    .eq('is_archived', false)
    .is('read_at', null)

  if (error) {
    return NextResponse.json(
      { error: 'Unable to count unread feedback.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

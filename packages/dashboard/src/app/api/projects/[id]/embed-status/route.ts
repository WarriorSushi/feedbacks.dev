import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error
  const { data, error } = await auth.admin
    .from('project_embed_installations')
    .select('last_seen_at, runtime_version, feedback_enabled, updates_enabled')
    .eq('project_id', id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load embed status.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  const lastSeenAt = data?.last_seen_at || null
  const stale = lastSeenAt ? Date.now() - new Date(lastSeenAt).getTime() > 1000 * 60 * 60 * 24 * 30 : false
  return NextResponse.json({
    state: !lastSeenAt ? 'not_detected' : stale ? 'stale' : 'connected',
    lastSeenAt,
    runtimeVersion: data?.runtime_version || null,
    modules: data
      ? { feedback: data.feedback_enabled, updates: data.updates_enabled }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } })
}

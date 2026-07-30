import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { editConflictResponse, formatVersionEtag, parseIfMatchVersion } from '@/lib/optimistic-concurrency'
const headers = { 'Cache-Control': 'no-store' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const { data: existing, error: existingError } = await auth.admin.from('product_updates').select('updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (existingError || !existing) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) return NextResponse.json({ code: 'PRECONDITION_REQUIRED', error: 'Reload this update before restoring it.' }, { status: 428, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } })
  if (expectedVersion !== existing.updated_at) return NextResponse.json(editConflictResponse(existing.updated_at), { status: 409, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } })
  const { data, error } = await auth.admin.from('product_updates').update({ status: 'draft', published_at: null, expires_at: null, updated_at: new Date().toISOString() }).eq('project_id', id).eq('id', updateId).eq('updated_at', expectedVersion).select('*').maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to restore update.' }, { status: 500, headers })
  if (!data) return NextResponse.json(editConflictResponse(existing.updated_at), { status: 409, headers })
  return NextResponse.json({ update: data }, { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
}

import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateInput } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getProductUpdateEntitlements } from '@/lib/product-update-entitlements'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import { readJsonBody } from '@/lib/api-request'
import {
  editConflictResponse,
  formatVersionEtag,
  parseIfMatchVersion,
} from '@/lib/optimistic-concurrency'

const headers = { 'Cache-Control': 'no-store' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request, { allowEmpty: true })
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  const { data: update } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!update) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) return NextResponse.json(
    { code: 'PRECONDITION_REQUIRED', error: 'Reload this update before publishing it.' },
    { status: 428, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } },
  )
  if (expectedVersion !== update.updated_at) return NextResponse.json(
    editConflictResponse(update.updated_at),
    { status: 409, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } },
  )
  const validation = sanitizeProductUpdateInput({ ...update, ...(body && typeof body === 'object' ? body : {}) }, { requirePublishFields: true })
  if (Object.keys(validation.errors).length) return NextResponse.json({ errors: validation.errors }, { status: 400, headers })
  const entitlements = await getProductUpdateEntitlements(auth.user.id)
  const { data, error } = await auth.admin.rpc('publish_product_update', {
    p_project_id: id, p_update_id: updateId, p_published_at: validation.data.publishedAt || null, p_expires_at: validation.data.expiresAt || null,
    p_active_limit: entitlements.productUpdateActiveLimit, p_allow_scheduling: entitlements.productUpdateScheduling,
    p_expected_updated_at: expectedVersion,
  })
  if (error?.message?.includes('version conflict')) {
    const { data: latest } = await auth.admin.from('product_updates').select('updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
    const currentVersion = latest?.updated_at || update.updated_at
    return NextResponse.json(editConflictResponse(currentVersion), {
      status: 409,
      headers: { ...headers, ETag: formatVersionEtag(currentVersion) },
    })
  }
  if (error || !data) return NextResponse.json({ error: error?.message?.includes('limit') ? 'Live update limit reached.' : 'Unable to publish update.' }, { status: 403, headers })
  void recordActivationMilestone({ projectId: id, userId: auth.user.id, eventName: 'updates_first_published', admin: auth.admin })
  return NextResponse.json({ update: data }, { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
}

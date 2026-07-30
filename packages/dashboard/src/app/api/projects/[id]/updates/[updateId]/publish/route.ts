import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateInput } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getProductUpdateEntitlements } from '@/lib/product-update-entitlements'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import { readJsonBody } from '@/lib/api-request'

const headers = { 'Cache-Control': 'no-store' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request, { allowEmpty: true })
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  const { data: update } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!update) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const validation = sanitizeProductUpdateInput({ ...update, ...(body && typeof body === 'object' ? body : {}) }, { requirePublishFields: true })
  if (Object.keys(validation.errors).length) return NextResponse.json({ errors: validation.errors }, { status: 400, headers })
  const entitlements = await getProductUpdateEntitlements(auth.user.id)
  const { data, error } = await auth.admin.rpc('publish_product_update', {
    p_project_id: id, p_update_id: updateId, p_published_at: validation.data.publishedAt || null, p_expires_at: validation.data.expiresAt || null,
    p_active_limit: entitlements.productUpdateActiveLimit, p_allow_scheduling: entitlements.productUpdateScheduling,
  })
  if (error || !data) return NextResponse.json({ error: error?.message?.includes('limit') ? 'Live update limit reached.' : 'Unable to publish update.' }, { status: 403, headers })
  void recordActivationMilestone({ projectId: id, userId: auth.user.id, eventName: 'updates_first_published', admin: auth.admin })
  return NextResponse.json({ update: data }, { headers })
}

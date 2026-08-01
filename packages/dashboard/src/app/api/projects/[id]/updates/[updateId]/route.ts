import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateInput } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { publicImageUrl } from '@/lib/product-update-service'
import { readJsonBody } from '@/lib/api-request'
import {
  editConflictResponse,
  formatVersionEtag,
  parseIfMatchVersion,
} from '@/lib/optimistic-concurrency'

const headers = { 'Cache-Control': 'no-store' }
async function resolve(params: Promise<{ id: string; updateId: string }>) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id)
  return { id, updateId, auth }
}
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const { data, error } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  return NextResponse.json(
    { update: { ...data, imageUrl: publicImageUrl(auth.admin, data.image_path) } },
    { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } },
  )
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  if (!body || typeof body !== 'object' || ['status', 'projectId', 'project_id', 'publishedAt', 'published_at', 'expiresAt', 'expires_at'].some((key) => key in body)) return NextResponse.json({ error: 'Lifecycle fields require their explicit action.' }, { status: 400, headers })
  const { data: existing, error: existingError } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (existingError || !existing) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) {
    return NextResponse.json(
      {
        code: 'PRECONDITION_REQUIRED',
        error: 'Reload this update before saving so newer edits are not overwritten.',
      },
      { status: 428, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } },
    )
  }
  if (expectedVersion !== existing.updated_at) {
    return NextResponse.json(editConflictResponse(existing.updated_at), {
      status: 409,
      headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) },
    })
  }
  const parsed = sanitizeProductUpdateInput({
    versionLabel: existing.version_label,
    title: existing.title,
    summary: existing.summary,
    highlights: existing.highlights,
    ctaLabel: existing.cta_label,
    ctaUrl: existing.cta_url,
    ctas: existing.ctas,
    ...(typeof existing.published_at === 'string' ? { publishedAt: existing.published_at } : {}),
    ...(typeof existing.expires_at === 'string' ? { expiresAt: existing.expires_at } : {}),
    ...(typeof existing.image_alt_text === 'string' ? { imageAltText: existing.image_alt_text } : {}),
    ...body,
  }, { requirePublishFields: true }); if (Object.keys(parsed.errors).length) return NextResponse.json({ errors: parsed.errors }, { status: 400, headers })
  const { data, error } = await auth.admin.from('product_updates').update({
    version_label: parsed.data.versionLabel || null, title: parsed.data.title, summary: parsed.data.summary,
    highlights: parsed.data.highlights,
    cta_label: parsed.data.ctas?.[0]?.label || parsed.data.ctaLabel || null,
    cta_url: parsed.data.ctas?.[0]?.url || parsed.data.ctaUrl || null,
    ctas: parsed.data.ctas || [],
    image_alt_text: parsed.data.imageAltText || null,
    updated_at: new Date().toISOString(),
  }).eq('project_id', id).eq('id', updateId).eq('updated_at', expectedVersion).select('*').maybeSingle()
  if (error) {
    console.error('Unable to save product update', error)
    return NextResponse.json({
      code: 'UPDATE_SAVE_FAILED',
      error: 'The update could not be saved. Your changes are still in the editor. Wait a moment, then try again; if it continues, reload the latest version.',
    }, { status: 500, headers })
  }
  if (!data) {
    const { data: latest } = await auth.admin.from('product_updates').select('updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
    const currentVersion = latest?.updated_at || existing.updated_at
    return NextResponse.json(editConflictResponse(currentVersion), {
      status: 409,
      headers: { ...headers, ETag: formatVersionEtag(currentVersion) },
    })
  }
  return NextResponse.json(
    { update: data },
    { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } },
  )
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const { data } = await auth.admin.from('product_updates').select('image_path,updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) return NextResponse.json({ code: 'PRECONDITION_REQUIRED', error: 'Reload this update before deleting it.' }, { status: 428, headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
  if (expectedVersion !== data.updated_at) return NextResponse.json(editConflictResponse(data.updated_at), { status: 409, headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
  const { data: deleted, error } = await auth.admin.from('product_updates').delete().eq('project_id', id).eq('id', updateId).eq('updated_at', expectedVersion).select('image_path').maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to delete update.' }, { status: 500, headers })
  if (!deleted) {
    const { data: latest } = await auth.admin.from('product_updates').select('updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
    const currentVersion = latest?.updated_at || data.updated_at
    return NextResponse.json(editConflictResponse(currentVersion), { status: 409, headers: { ...headers, ETag: formatVersionEtag(currentVersion) } })
  }
  if (deleted.image_path) {
    const { error: storageError } = await auth.admin.storage.from('product_update_images').remove([deleted.image_path])
    if (storageError) console.error('Unable to remove deleted product update media', storageError)
  }
  return new NextResponse(null, { status: 204, headers })
}

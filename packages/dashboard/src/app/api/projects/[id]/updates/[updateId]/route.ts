import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateInput } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { publicImageUrl } from '@/lib/product-update-service'
import { readJsonBody } from '@/lib/api-request'

const headers = { 'Cache-Control': 'no-store' }
async function resolve(params: Promise<{ id: string; updateId: string }>) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id)
  return { id, updateId, auth }
}
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const { data, error } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  return NextResponse.json({ update: { ...data, imageUrl: publicImageUrl(auth.admin, data.image_path) } }, { headers })
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  if (!body || typeof body !== 'object' || ['status', 'projectId', 'project_id', 'publishedAt', 'published_at', 'expiresAt', 'expires_at'].some((key) => key in body)) return NextResponse.json({ error: 'Lifecycle fields require their explicit action.' }, { status: 400, headers })
  const { data: existing, error: existingError } = await auth.admin.from('product_updates').select('*').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (existingError || !existing) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const parsed = sanitizeProductUpdateInput({
    versionLabel: existing.version_label,
    title: existing.title,
    summary: existing.summary,
    highlights: existing.highlights,
    ctaLabel: existing.cta_label,
    ctaUrl: existing.cta_url,
    ...(typeof existing.published_at === 'string' ? { publishedAt: existing.published_at } : {}),
    ...(typeof existing.expires_at === 'string' ? { expiresAt: existing.expires_at } : {}),
    ...(typeof existing.image_alt_text === 'string' ? { imageAltText: existing.image_alt_text } : {}),
    ...body,
  }, { requirePublishFields: true }); if (Object.keys(parsed.errors).length) return NextResponse.json({ errors: parsed.errors }, { status: 400, headers })
  const { data, error } = await auth.admin.from('product_updates').update({
    version_label: parsed.data.versionLabel || null, title: parsed.data.title, summary: parsed.data.summary,
    highlights: parsed.data.highlights, cta_label: parsed.data.ctaLabel || null, cta_url: parsed.data.ctaUrl || null,
    image_alt_text: parsed.data.imageAltText || null,
  }).eq('project_id', id).eq('id', updateId).select('*').maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Unable to save update.' }, { status: 500, headers })
  return NextResponse.json({ update: data }, { headers })
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId, auth } = await resolve(params); if ('error' in auth) return auth.error
  const { data } = await auth.admin.from('product_updates').select('image_path').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!data) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  if (data.image_path) {
    const { error: storageError } = await auth.admin.storage.from('product_update_images').remove([data.image_path])
    if (storageError) return NextResponse.json({ error: 'Unable to remove update media. Try again.' }, { status: 500, headers })
  }
  const { error } = await auth.admin.from('product_updates').delete().eq('project_id', id).eq('id', updateId)
  if (error) return NextResponse.json({ error: 'Unable to delete update.' }, { status: 500, headers })
  return new NextResponse(null, { status: 204, headers })
}

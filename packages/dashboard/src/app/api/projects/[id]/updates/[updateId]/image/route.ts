import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { publicImageUrl } from '@/lib/product-update-service'
import { readRequestBodyWithLimit, RequestBodyTooLargeError } from '@/lib/request-body-limit'
import { validateAndSanitizeFeedbackImage } from '@/lib/feedback-media-validation'
import { editConflictResponse, formatVersionEtag, parseIfMatchVersion } from '@/lib/optimistic-concurrency'

const headers = { 'Cache-Control': 'no-store' }
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const { data: update } = await auth.admin.from('product_updates').select('image_path,updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!update) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) return NextResponse.json({ code: 'PRECONDITION_REQUIRED', error: 'Reload this update before changing its image.' }, { status: 428, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } })
  if (expectedVersion !== update.updated_at) return NextResponse.json(editConflictResponse(update.updated_at), { status: 409, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } })
  let bytes: Uint8Array; try { bytes = await readRequestBodyWithLimit(request, 2 * 1024 * 1024) } catch (error) { return NextResponse.json({ error: error instanceof RequestBodyTooLargeError ? 'Image exceeds 2 MB.' : 'Unable to read image.' }, { status: 413, headers }) }
  const contentType = request.headers.get('content-type')?.split(';')[0] || ''
  let image
  try {
    image = await validateAndSanitizeFeedbackImage({
      buffer: Buffer.from(bytes),
      claimedMimeType: contentType,
      originalFilename: 'product-update-image',
      maxBytes: 2 * 1024 * 1024,
    })
  } catch {
    return NextResponse.json({ error: 'Use a valid JPEG or PNG image up to 2 MB.' }, { status: 400, headers })
  }
  const path = `${id}/${updateId}/${crypto.randomUUID()}.${image.extension}`
  const { error: uploadError } = await auth.admin.storage.from('product_update_images').upload(path, image.buffer, { contentType: image.mimeType, upsert: false })
  if (uploadError) return NextResponse.json({ error: 'Unable to upload image.' }, { status: 500, headers })
  const { data, error } = await auth.admin.from('product_updates').update({ image_path: path, updated_at: new Date().toISOString() }).eq('project_id', id).eq('id', updateId).eq('updated_at', expectedVersion).select('*').maybeSingle()
  if (error) { await auth.admin.storage.from('product_update_images').remove([path]); return NextResponse.json({ error: 'Unable to save image.' }, { status: 500, headers }) }
  if (!data) { await auth.admin.storage.from('product_update_images').remove([path]); return NextResponse.json(editConflictResponse(update.updated_at), { status: 409, headers }) }
  if (update.image_path) await auth.admin.storage.from('product_update_images').remove([update.image_path])
  return NextResponse.json({ update: { ...data, imageUrl: publicImageUrl(auth.admin, path) } }, { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const { data: update } = await auth.admin.from('product_updates').select('image_path,updated_at').eq('project_id', id).eq('id', updateId).maybeSingle()
  if (!update) return NextResponse.json({ error: 'Update not found.' }, { status: 404, headers })
  const expectedVersion = parseIfMatchVersion(request.headers.get('if-match'))
  if (!expectedVersion) return NextResponse.json({ code: 'PRECONDITION_REQUIRED', error: 'Reload this update before changing its image.' }, { status: 428, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } })
  if (expectedVersion !== update.updated_at) return NextResponse.json(editConflictResponse(update.updated_at), { status: 409, headers: { ...headers, ETag: formatVersionEtag(update.updated_at) } })
  const { data, error } = await auth.admin.from('product_updates').update({ image_path: null, updated_at: new Date().toISOString() }).eq('project_id', id).eq('id', updateId).eq('updated_at', expectedVersion).select('updated_at').maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to remove image.' }, { status: 500, headers })
  if (!data) return NextResponse.json(editConflictResponse(update.updated_at), { status: 409, headers })
  if (update.image_path) await auth.admin.storage.from('product_update_images').remove([update.image_path])
  return new NextResponse(null, { status: 204, headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } })
}

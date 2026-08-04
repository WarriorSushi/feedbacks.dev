import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { readJsonBody } from '@/lib/api-request'
import { getProductUpdateEntitlements } from '@/lib/product-update-entitlements'
import {
  editConflictResponse,
  formatVersionEtag,
  parseMutationVersion,
} from '@/lib/optimistic-concurrency'

const headers = { 'Cache-Control': 'no-store' }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  const { id, updateId } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error

  const bodyResult = await readJsonBody<{ enabled?: unknown }>(request)
  if (!bodyResult.ok) return bodyResult.response
  if (typeof bodyResult.data.enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'Choose whether this release note should be shown to users.' },
      { status: 400, headers },
    )
  }

  const { data: existing, error: existingError } = await auth.admin
    .from('product_updates')
    .select('*')
    .eq('project_id', id)
    .eq('id', updateId)
    .maybeSingle()
  if (existingError || !existing) {
    return NextResponse.json({ error: 'Release note not found.' }, { status: 404, headers })
  }

  const expectedVersion = parseMutationVersion(request.headers)
  if (!expectedVersion) {
    return NextResponse.json(
      { code: 'PRECONDITION_REQUIRED', error: 'Reload this release note before changing its visibility.' },
      { status: 428, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } },
    )
  }
  if (expectedVersion !== existing.updated_at) {
    return NextResponse.json(
      editConflictResponse(existing.updated_at),
      { status: 409, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } },
    )
  }
  if (existing.is_enabled === bodyResult.data.enabled) {
    return NextResponse.json(
      { update: existing },
      { headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } },
    )
  }

  const entitlements = await getProductUpdateEntitlements(auth.user.id)
  const { data, error } = await auth.admin.rpc('set_product_update_visibility', {
    p_project_id: id,
    p_update_id: updateId,
    p_enabled: bodyResult.data.enabled,
    p_active_limit: entitlements.productUpdateActiveLimit,
    p_expected_updated_at: expectedVersion,
  })

  if (error?.message?.includes('version conflict')) {
    const { data: latest } = await auth.admin
      .from('product_updates')
      .select('updated_at')
      .eq('project_id', id)
      .eq('id', updateId)
      .maybeSingle()
    const currentVersion = latest?.updated_at || existing.updated_at
    return NextResponse.json(
      editConflictResponse(currentVersion),
      { status: 409, headers: { ...headers, ETag: formatVersionEtag(currentVersion) } },
    )
  }
  if (error || !data) {
    return NextResponse.json(
      {
        error: error?.message?.includes('limit')
          ? 'Your plan’s live release-note limit is already in use. Hide another live note or upgrade first.'
          : 'Release-note visibility could not be changed.',
      },
      { status: error?.message?.includes('limit') ? 403 : 500, headers },
    )
  }

  return NextResponse.json(
    { update: data },
    { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } },
  )
}

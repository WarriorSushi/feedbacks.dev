import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateSettings } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getProductUpdateEntitlements } from '@/lib/product-update-entitlements'
import { mapProductUpdateSettings } from '@/lib/product-update-service'
import { readJsonBody } from '@/lib/api-request'
import {
  editConflictResponse,
  formatVersionEtag,
  parseMutationVersion,
} from '@/lib/optimistic-concurrency'

const headers = { 'Cache-Control': 'no-store' }
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const { data, error } = await auth.admin.from('product_update_settings').select('*').eq('project_id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load settings.' }, { status: 500, headers })
  return NextResponse.json(
    {
      settings: { enabled: data?.enabled === true, ...mapProductUpdateSettings(data) },
      settingsVersion: data?.updated_at || null,
    },
    {
      headers: data?.updated_at
        ? { ...headers, ETag: formatVersionEtag(data.updated_at) }
        : headers,
    },
  )
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  const parsed = sanitizeProductUpdateSettings(body); if (Object.keys(parsed.errors).length) return NextResponse.json({ errors: parsed.errors }, { status: 400, headers })
  const entitlements = await getProductUpdateEntitlements(auth.user.id)
  const { data: existing, error: existingError } = await auth.admin
    .from('product_update_settings')
    .select('*')
    .eq('project_id', id)
    .maybeSingle()
  if (existingError) return NextResponse.json({ error: 'Unable to load settings.' }, { status: 500, headers })
  const expectedVersion = parseMutationVersion(request.headers)
  if (existing && !expectedVersion) {
    return NextResponse.json(
      {
        code: 'PRECONDITION_REQUIRED',
        error: 'Reload update settings before saving so newer edits are not overwritten.',
      },
      { status: 428, headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) } },
    )
  }
  if (existing && expectedVersion !== existing.updated_at) {
    return NextResponse.json(editConflictResponse(existing.updated_at), {
      status: 409,
      headers: { ...headers, ETag: formatVersionEtag(existing.updated_at) },
    })
  }
  const settings = parsed.data
  const values = {
    project_id: id, enabled: settings.enabled ?? existing?.enabled ?? false, auto_show: settings.autoShow ?? existing?.auto_show ?? true,
    display_delay_ms: settings.displayDelayMs ?? existing?.display_delay_ms ?? 1500, theme: settings.theme ?? existing?.theme ?? 'auto', accent_color: settings.accentColor ?? existing?.accent_color ?? null,
    include_paths: settings.includePaths ?? existing?.include_paths ?? [], exclude_paths: settings.excludePaths ?? existing?.exclude_paths ?? [], show_powered_by: entitlements.customBranding ? settings.showPoweredBy ?? existing?.show_powered_by ?? true : true,
    updated_at: new Date().toISOString(),
  }
  const mutation = existing
    ? auth.admin
        .from('product_update_settings')
        .update(values)
        .eq('project_id', id)
        .eq('updated_at', expectedVersion!)
    : auth.admin.from('product_update_settings').insert(values)
  const { data, error } = await mutation.select('*').maybeSingle()
  if (!error && !data && existing) {
    const { data: latest } = await auth.admin
      .from('product_update_settings')
      .select('updated_at')
      .eq('project_id', id)
      .maybeSingle()
    const currentVersion = latest?.updated_at || existing.updated_at
    return NextResponse.json(editConflictResponse(currentVersion), {
      status: 409,
      headers: { ...headers, ETag: formatVersionEtag(currentVersion) },
    })
  }
  if (error || !data) return NextResponse.json({ error: 'Unable to save settings.' }, { status: 500, headers })
  return NextResponse.json(
    {
      settings: { enabled: data.enabled, ...mapProductUpdateSettings(data) },
      settingsVersion: data.updated_at,
    },
    { headers: { ...headers, ETag: formatVersionEtag(data.updated_at) } },
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateSettings } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getProductUpdateEntitlements } from '@/lib/product-update-entitlements'
import { mapProductUpdateSettings } from '@/lib/product-update-service'
import { readJsonBody } from '@/lib/api-request'

const headers = { 'Cache-Control': 'no-store' }
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const auth = await getAuthedUserAndProject(id); if ('error' in auth) return auth.error
  const { data, error } = await auth.admin.from('product_update_settings').select('*').eq('project_id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Unable to load settings.' }, { status: 500, headers })
  return NextResponse.json({ enabled: data?.enabled === true, ...mapProductUpdateSettings(data) }, { headers })
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
  const settings = parsed.data
  const { data, error } = await auth.admin.from('product_update_settings').upsert({
    project_id: id, enabled: settings.enabled ?? existing?.enabled ?? false, auto_show: settings.autoShow ?? existing?.auto_show ?? true,
    display_delay_ms: settings.displayDelayMs ?? existing?.display_delay_ms ?? 1500, theme: settings.theme ?? existing?.theme ?? 'auto', accent_color: settings.accentColor ?? existing?.accent_color ?? null,
    include_paths: settings.includePaths ?? existing?.include_paths ?? [], exclude_paths: settings.excludePaths ?? existing?.exclude_paths ?? [], show_powered_by: entitlements.customBranding ? settings.showPoweredBy ?? existing?.show_powered_by ?? true : true,
  }).select('*').single()
  if (error || !data) return NextResponse.json({ error: 'Unable to save settings.' }, { status: 500, headers })
  return NextResponse.json({ enabled: data.enabled, ...mapProductUpdateSettings(data) }, { headers })
}

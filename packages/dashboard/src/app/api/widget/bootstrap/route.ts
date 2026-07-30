import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildPublicWidgetConfig, sanitizeProductUpdateCta, type WidgetBootstrapResponse } from '@feedbacks/shared'
import { createAdminSupabase } from '@/lib/supabase-server'
import { getPublicProjectLookup } from '@/lib/project-api-keys'
import { isWidgetRequestOriginAllowed } from '@/lib/origin-allowlist'
import { publicEnv } from '@/lib/public-env'
import { checkRateLimit } from '@/lib/rate-limit'
import { isProductUpdateResponseBounded, mapProductUpdate, mapProductUpdateSettings, publicImageUrl } from '@/lib/product-update-service'
import type { Project } from '@/lib/types'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
const cache = 'public, max-age=60, stale-while-revalidate=300'
const projectKeyValid = (value: string | null) => Boolean(value && value.length <= 200 && /^[A-Za-z0-9_-]+$/.test(value))

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }) }

export async function GET(request: NextRequest) {
  const projectKey = request.nextUrl.searchParams.get('projectKey')
  if (!projectKeyValid(projectKey)) return NextResponse.json({ error: 'Invalid project key.' }, { status: 400, headers: cors })
  const rate = await checkRateLimit(request, 'widget-bootstrap-read', 60, 1, projectKey!)
  if (!rate.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { ...cors, 'Retry-After': '60' } })

  const admin = await createAdminSupabase()
  const lookup = await getPublicProjectLookup(projectKey!)
  if (!lookup) return NextResponse.json({ error: 'Invalid project key.' }, { status: 400, headers: cors })
  const { data: project, error: projectError } = await admin.from('projects').select('id,settings').eq(lookup.column, lookup.value).maybeSingle()
  if (projectError) return NextResponse.json({ error: 'Bootstrap temporarily unavailable.' }, { status: 503, headers: cors })
  if (!project) {
    const unavailable: WidgetBootstrapResponse = {
      configVersion: 2,
      modules: { feedback: false, updates: false },
      feedbackConfig: buildPublicWidgetConfig(projectKey!, {}, { appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN }),
    }
    return NextResponse.json(unavailable, { headers: { ...cors, 'Cache-Control': cache } })
  }
  if (!isWidgetRequestOriginAllowed(request, (project as Project).settings?.widget_origin_restriction, { trustedOrigins: [publicEnv.NEXT_PUBLIC_APP_ORIGIN] })) return NextResponse.json({ error: 'Origin not allowed.' }, { status: 403, headers: cors })

  const { data: updateSettings, error: updateSettingsError } = await admin.from('product_update_settings').select('*').eq('project_id', project.id).maybeSingle()
  if (updateSettingsError) return NextResponse.json({ error: 'Bootstrap temporarily unavailable.' }, { status: 503, headers: cors })
  const feedback = (project as Project).settings?.widget_config?.feedbackEnabled !== false
  const updates = updateSettings?.enabled === true
  const response: WidgetBootstrapResponse = {
    configVersion: 2,
    modules: { feedback, updates },
    feedbackConfig: buildPublicWidgetConfig(
      projectKey!,
      (project as Project).settings?.widget_config,
      { appOrigin: publicEnv.NEXT_PUBLIC_APP_ORIGIN },
    ),
  }
  if (updates) {
    const now = new Date().toISOString()
    const { data, error } = await admin.from('product_updates').select('*').eq('project_id', project.id).eq('status', 'published').lte('published_at', now).or(`expires_at.is.null,expires_at.gt.${now}`).order('published_at', { ascending: false }).order('id', { ascending: false }).limit(20)
    if (error) return NextResponse.json({ error: 'Bootstrap temporarily unavailable.' }, { status: 503, headers: cors })
    response.updates = { settings: mapProductUpdateSettings(updateSettings), updates: (data || []).map((row) => mapProductUpdate(row, publicImageUrl(admin, row.image_path))).filter((update) => !update.ctaUrl || Boolean(sanitizeProductUpdateCta(update.ctaUrl))) }
  }
  if (!isProductUpdateResponseBounded(response)) return NextResponse.json({ error: 'Response too large.' }, { status: 500, headers: cors })

  const requestedRuntimeVersion = request.nextUrl.searchParams.get('runtimeVersion')?.trim() || ''
  const runtimeVersion = /^[A-Za-z0-9._+-]{1,64}$/.test(requestedRuntimeVersion) ? requestedRuntimeVersion : null
  const { data: installation } = await admin.from('project_embed_installations').select('last_seen_at').eq('project_id', project.id).maybeSingle()
  if (!installation || Date.now() - new Date(installation.last_seen_at).getTime() > 1000 * 60 * 15) {
    // Await the throttled write so serverless runtimes do not terminate before
    // the heartbeat is persisted. Installation tracking must never block the
    // public bootstrap response when the migration is not available yet.
    await admin.from('project_embed_installations').upsert({ project_id: project.id, last_seen_at: new Date().toISOString(), runtime_version: runtimeVersion, feedback_enabled: feedback, updates_enabled: updates }, { onConflict: 'project_id' })
  }
  const etag = `"${createHash('sha256').update(JSON.stringify(response)).digest('base64url')}"`
  if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers: { ...cors, ETag: etag, 'Cache-Control': cache } })
  return NextResponse.json(response, { headers: { ...cors, ETag: etag, 'Cache-Control': cache } })
}

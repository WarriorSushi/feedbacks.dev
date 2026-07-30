import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateCta, type ProductUpdatesPublicResponse } from '@feedbacks/shared'
import { createAdminSupabase } from '@/lib/supabase-server'
import { getPublicProjectLookup } from '@/lib/project-api-keys'
import { isWidgetRequestOriginAllowed } from '@/lib/origin-allowlist'
import { publicEnv } from '@/lib/public-env'
import { checkRateLimit } from '@/lib/rate-limit'
import { mapProductUpdate, mapProductUpdateSettings, publicImageUrl, isProductUpdateResponseBounded } from '@/lib/product-update-service'
import type { Project } from '@/lib/types'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
const projectKeyValid = (value: string | null) => Boolean(value && value.length <= 200 && /^[A-Za-z0-9_-]+$/.test(value))
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }) }
export async function GET(request: NextRequest) {
  const projectKey = request.nextUrl.searchParams.get('projectKey'); if (!projectKeyValid(projectKey)) return NextResponse.json({ error: 'Invalid project key.' }, { status: 400, headers: cors })
  const rate = await checkRateLimit(request, 'product-updates-read', 60, 1, projectKey!); if (!rate.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { ...cors, 'Retry-After': '60' } })
  const lookup = await getPublicProjectLookup(projectKey!); if (!lookup) return NextResponse.json({ error: 'Invalid project key.' }, { status: 400, headers: cors })
  const admin = await createAdminSupabase(); const { data: project } = await admin.from('projects').select('id,settings').eq(lookup.column, lookup.value).maybeSingle()
  if (!project) return NextResponse.json({ settings: mapProductUpdateSettings(), updates: [] }, { headers: { ...cors, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  if (!isWidgetRequestOriginAllowed(request, (project as Project).settings?.widget_origin_restriction, { trustedOrigins: [publicEnv.NEXT_PUBLIC_APP_ORIGIN] })) return NextResponse.json({ error: 'Origin not allowed.' }, { status: 403, headers: cors })
  const { data: settings } = await admin.from('product_update_settings').select('*').eq('project_id', project.id).maybeSingle()
  const response: ProductUpdatesPublicResponse = { settings: mapProductUpdateSettings(settings), updates: [] }
  if (settings?.enabled) {
    const now = new Date().toISOString()
    const { data } = await admin.from('product_updates').select('*').eq('project_id', project.id).eq('status', 'published').lte('published_at', now).or(`expires_at.is.null,expires_at.gt.${now}`).order('published_at', { ascending: false }).order('id', { ascending: false }).limit(20)
    response.updates = (data || []).map((row) => mapProductUpdate(row, publicImageUrl(admin, row.image_path))).filter((update) => !update.ctaUrl || Boolean(sanitizeProductUpdateCta(update.ctaUrl)))
  }
  if (!isProductUpdateResponseBounded(response)) return NextResponse.json({ error: 'Response too large.' }, { status: 500, headers: cors })
  const etag = `\"${createHash('sha256').update(JSON.stringify(response)).digest('base64url')}\"`
  if (request.headers.get('if-none-match') === etag) return new NextResponse(null, { status: 304, headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
  return NextResponse.json(response, { headers: { ...cors, ETag: etag, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}

import { NextRequest, NextResponse } from 'next/server'
import { sanitizeProductUpdateInput } from '@feedbacks/shared'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { getProductUpdateEntitlements, getProductUpdateMetricsCutoff } from '@/lib/product-update-entitlements'
import { mapProductUpdateSettings, publicImageUrl } from '@/lib/product-update-service'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import { readJsonBody } from '@/lib/api-request'

const headers = { 'Cache-Control': 'no-store' }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error
  const entitlements = await getProductUpdateEntitlements(auth.user.id)
  const [settingsResult, updatesResult, metricsResult] = await Promise.all([
    auth.admin.from('product_update_settings').select('*').eq('project_id', id).maybeSingle(),
    auth.admin.from('product_updates').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    auth.admin.from('product_update_metrics').select('update_id,event_type,count').eq('project_id', id).gte('metric_date', getProductUpdateMetricsCutoff(entitlements.productUpdateAnalyticsDays)),
  ])
  if (updatesResult.error || settingsResult.error || metricsResult.error) return NextResponse.json({ error: 'Unable to load Product Updates.' }, { status: 500, headers })
  const metrics = new Map<string, { impressions: number; dismissals: number; ctaClicks: number }>()
  for (const row of metricsResult.data || []) {
    const item = metrics.get(row.update_id) || { impressions: 0, dismissals: 0, ctaClicks: 0 }
    if (row.event_type === 'impression') item.impressions += Number(row.count || 0)
    if (row.event_type === 'dismissal') item.dismissals += Number(row.count || 0)
    if (row.event_type === 'cta_click') item.ctaClicks += Number(row.count || 0)
    metrics.set(row.update_id, item)
  }
  return NextResponse.json({
    settings: { enabled: settingsResult.data?.enabled === true, ...mapProductUpdateSettings(settingsResult.data) },
    settingsVersion: settingsResult.data?.updated_at || null,
    entitlements: { scheduling: entitlements.productUpdateScheduling, analyticsDays: entitlements.productUpdateAnalyticsDays, activeLimit: entitlements.productUpdateActiveLimit, customBranding: entitlements.customBranding },
    updates: (updatesResult.data || []).map((row) => ({ ...row, imageUrl: publicImageUrl(auth.admin, row.image_path), metrics: metrics.get(row.id) || { impressions: 0, dismissals: 0, ctaClicks: 0 } })),
  }, { headers })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return bodyResult.response
  const body: unknown = bodyResult.data
  if (body && typeof body === 'object' && 'status' in body) return NextResponse.json({ error: 'Draft creation cannot set status.' }, { status: 400, headers })
  const parsed = sanitizeProductUpdateInput(body, { requirePublishFields: true })
  if (Object.keys(parsed.errors).length) return NextResponse.json({ errors: parsed.errors }, { status: 400, headers })
  const { data, error } = await auth.admin.from('product_updates').insert({
    project_id: id, created_by: auth.user.id, status: 'draft', version_label: dataValue(parsed.data.versionLabel),
    title: parsed.data.title, summary: parsed.data.summary, highlights: parsed.data.highlights || [],
    cta_label: dataValue(parsed.data.ctaLabel), cta_url: dataValue(parsed.data.ctaUrl),
    image_alt_text: dataValue(parsed.data.imageAltText),
  }).select('*').single()
  if (error || !data) return NextResponse.json({ error: 'Unable to save draft.' }, { status: 500, headers })
  void recordActivationMilestone({ projectId: id, userId: auth.user.id, eventName: 'updates_first_draft_created', admin: auth.admin })
  return NextResponse.json({ update: data }, { status: 201, headers })
}

function dataValue(value?: string) { return value || null }

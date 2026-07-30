import { NextRequest, NextResponse } from 'next/server'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { readJsonBody } from '@/lib/api-request'

const headers = { 'Cache-Control': 'no-store' }

async function moduleResponse(auth: Exclude<Awaited<ReturnType<typeof getAuthedUserAndProject>>, { error: NextResponse }>, id: string) {
  const current = await moduleResponseData(auth, id)
  if (current.error) return NextResponse.json({ error: 'Unable to load product settings.' }, { status: 500, headers })
  return NextResponse.json(current.data, { headers })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error
  return moduleResponse(auth, id)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await getAuthedUserAndProject(id)
  if ('error' in auth) return auth.error
  const bodyResult = await readJsonBody<{ feedback?: boolean; updates?: boolean }>(request, { maxBytes: 2_048 })
  if (!bodyResult.ok) return bodyResult.response
  const body = bodyResult.data
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0 || Object.keys(body).some((key) => key !== 'feedback' && key !== 'updates') || Object.values(body).some((value) => typeof value !== 'boolean')) return NextResponse.json({ error: 'Send at least one feedback or updates boolean.' }, { status: 400, headers })
  const values = body as { feedback?: boolean; updates?: boolean }
  const current = await moduleResponseData(auth, id)
  if (current.error) return NextResponse.json({ error: 'Unable to load product settings.' }, { status: 500, headers })
  const feedback = values.feedback ?? current.data.feedback
  const updates = values.updates ?? current.data.updates
  const { data, error } = await auth.admin.rpc('set_project_modules', {
    p_project_id: id,
    p_feedback: feedback,
    p_updates: updates,
  }).single()
  if (error || !data) return NextResponse.json({ error: 'Unable to update product settings.' }, { status: 500, headers })
  return NextResponse.json(data, { headers })
}

async function moduleResponseData(auth: Exclude<Awaited<ReturnType<typeof getAuthedUserAndProject>>, { error: NextResponse }>, id: string) {
  const { data, error } = await auth.admin.from('product_update_settings').select('enabled').eq('project_id', id).maybeSingle()
  return error
    ? { data: null, error }
    : { data: { feedback: auth.project.settings?.widget_config?.feedbackEnabled !== false, updates: data?.enabled === true }, error: null }
}

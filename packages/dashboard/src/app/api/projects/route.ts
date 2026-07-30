import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import { assertCanCreateProject } from '@/lib/billing'
import { hasE2EBypass } from '@/lib/e2e'
import {
  generateProjectApiKey,
  getProjectApiKeyLastFour,
  hashProjectApiKey,
} from '@/lib/project-api-keys'
import { DEFAULT_PROJECT_ICON, isProjectIcon } from '@/lib/project-icons'
import { recordActivationMilestone } from '@/lib/activation-milestones'
import { readJsonBody } from '@/lib/api-request'
import { normalizeProjectDomain } from '@/lib/project-input'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SAFE_PROJECT_SELECT = 'id,owner_user_id,name,api_key_last_four,domain,webhooks,settings,environment,test_namespace,expires_at,quarantined_at,created_at,updated_at'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminSupabase()
    const { data, error } = await admin
      .from('projects')
      .select(SAFE_PROJECT_SELECT)
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bodyResult = await readJsonBody<{
      name?: string
      domain?: string
      icon?: string
      creationRequestId?: string
    }>(request)
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
    const creationRequestId = body.creationRequestId?.trim() || null
    if (creationRequestId && !UUID_RE.test(creationRequestId)) {
      return NextResponse.json({ error: 'Invalid project creation request identifier' }, { status: 400 })
    }
    const admin = await createAdminSupabase()
    if (creationRequestId) {
      const { data: existing } = await admin
        .from('projects')
        .select(SAFE_PROJECT_SELECT)
        .eq('owner_user_id', user.id)
        .eq('creation_request_id', creationRequestId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ ...existing, api_key: null, replayed: true })
      }
    }

    const isE2ERequest = hasE2EBypass(request)
    if (!isE2ERequest) {
      const entitlement = await assertCanCreateProject(user.id, user.email)
      if (!entitlement.allowed) {
        return NextResponse.json(
          { error: entitlement.message, code: entitlement.code, usage: entitlement.summary.usage },
          { status: 403 },
        )
      }
    }

    const name = body.name?.trim()
    if (!name || name.length < 1 || name.length > 80) {
      return NextResponse.json({ error: 'Project name is required (1–80 characters)' }, { status: 400 })
    }

    const domain = normalizeProjectDomain(body.domain)
    if (domain === undefined) {
      return NextResponse.json({ error: 'Enter a valid website domain or URL' }, { status: 400 })
    }
    const icon = body.icon === undefined ? DEFAULT_PROJECT_ICON : body.icon
    if (!isProjectIcon(icon)) {
      return NextResponse.json({ error: 'Choose a valid project icon' }, { status: 400 })
    }

    const rawApiKey = generateProjectApiKey()
    const apiKeyHash = await hashProjectApiKey(rawApiKey)

    const now = new Date().toISOString()
    const project = {
      id: crypto.randomUUID(),
      owner_user_id: user.id,
      name,
      creation_request_id: creationRequestId,
      api_key: null,
      api_key_hash: null,
      api_key_last_four: getProjectApiKeyLastFour(rawApiKey),
      domain,
      webhooks: {},
      settings: { icon },
      created_at: now,
      updated_at: now,
      environment: isE2ERequest ? 'e2e' : 'production',
      test_namespace: isE2ERequest
        ? request.headers.get('x-feedbacks-test-namespace')?.slice(0, 120) || 'playwright'
        : null,
      expires_at: isE2ERequest
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null,
      quarantined_at: null,
    }

    const { data, error } = await admin.from('projects').insert(project).select(SAFE_PROJECT_SELECT).single()
    if (error) {
      if (creationRequestId && error.code === '23505') {
        const { data: existing } = await admin
          .from('projects')
          .select(SAFE_PROJECT_SELECT)
          .eq('owner_user_id', user.id)
          .eq('creation_request_id', creationRequestId)
          .maybeSingle()
        if (existing) return NextResponse.json({ ...existing, api_key: null, replayed: true })
      }
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    const { error: apiKeyError } = await admin.rpc('rotate_project_api_key', {
      p_project_id: data.id,
      p_key_hash: apiKeyHash,
      p_key_last_four: getProjectApiKeyLastFour(rawApiKey),
      p_actor_user_id: user.id,
    })
    if (apiKeyError) {
      await admin.from('projects').delete().eq('id', data.id)
      return NextResponse.json({ error: 'Failed to create a private API key' }, { status: 500 })
    }

    await recordActivationMilestone({
      projectId: data.id,
      userId: user.id,
      eventName: 'project_created',
      admin,
    })

    return NextResponse.json({ ...data, api_key: rawApiKey }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

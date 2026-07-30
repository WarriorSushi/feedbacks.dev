import { NextRequest, NextResponse } from 'next/server'
import { createAgentSetupToken } from '@/lib/agent-setup'
import { getAuthedUserAndProject } from '@/lib/api-auth'
import { env } from '@/lib/env'
import { getProjectPublishableKey } from '@/lib/project-api-keys'
import { readJsonBody } from '@/lib/api-request'

type RouteParams = { params: Promise<{ id: string }> }

interface SetupTokenRow {
  token_id: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

function setupTokenColumns() {
  return 'token_id, expires_at, revoked_at, created_at'
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { user, project, admin } = result
    const bodyResult = await readJsonBody<{ projectKey?: string }>(request, { maxBytes: 4_096 })
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
    const providedProjectKey = typeof body.projectKey === 'string' ? body.projectKey.trim() : ''
    const projectKey = getProjectPublishableKey(project.id)
    if (providedProjectKey && providedProjectKey !== projectKey) {
      return NextResponse.json({ error: 'Project key does not match this project.' }, { status: 400 })
    }

    const { token, payload } = createAgentSetupToken({
      projectId: project.id,
      userId: user.id,
      projectKey,
    })
    const packetUrl = `${env.NEXT_PUBLIC_APP_ORIGIN}/api/setup/packet?token=${encodeURIComponent(token)}`

    const { error: tokenInsertError } = await admin.from('agent_setup_tokens').insert({
      id: crypto.randomUUID(),
      token_id: payload.tokenId,
      project_id: project.id,
      user_id: user.id,
      expires_at: payload.expiresAt,
      metadata: {
        user_agent: request.headers.get('user-agent') || null,
      },
      created_at: new Date().toISOString(),
    })

    if (tokenInsertError) {
      return NextResponse.json(
        { error: 'Failed to persist setup token. Run the agent setup token migration before using packet links.' },
        { status: 500 },
      )
    }

    await admin.from('agent_setup_audit').insert({
      id: crypto.randomUUID(),
      project_id: project.id,
      user_id: user.id,
      event_type: 'token_created',
      expires_at: payload.expiresAt,
      metadata: {
        user_agent: request.headers.get('user-agent') || null,
      },
      created_at: new Date().toISOString(),
    }).then(() => undefined, () => undefined)

    return NextResponse.json({
      token,
      tokenId: payload.tokenId,
      packetUrl,
      expiresAt: payload.expiresAt,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create setup token. Please retry.' },
      { status: 500 },
    )
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { admin } = result
    const { data, error } = await admin
      .from('agent_setup_tokens')
      .select(setupTokenColumns())
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load setup token status. Run the agent setup token migration first.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ tokens: data || [] })
  } catch {
    return NextResponse.json(
      { error: 'Failed to load setup tokens. Please retry.' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getAuthedUserAndProject(id)
    if ('error' in result) return result.error

    const { user, project, admin } = result
    const bodyResult = await readJsonBody<{ tokenId?: string }>(request, { maxBytes: 4_096 })
    if (!bodyResult.ok) return bodyResult.response
    const body = bodyResult.data
    const tokenId = typeof body.tokenId === 'string' ? body.tokenId.trim() : ''
    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
    }

    const revokedAt = new Date().toISOString()
    const { data, error } = await admin
      .from('agent_setup_tokens')
      .update({ revoked_at: revokedAt })
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .eq('token_id', tokenId)
      .is('revoked_at', null)
      .select(setupTokenColumns())
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke setup token' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Setup token not found or already revoked' }, { status: 404 })
    }
    const revokedToken = data as unknown as SetupTokenRow

    await admin.from('agent_setup_audit').insert({
      id: crypto.randomUUID(),
      project_id: project.id,
      user_id: user.id,
      event_type: 'token_revoked',
      expires_at: revokedToken.expires_at,
      metadata: {
        token_id: tokenId,
      },
      created_at: revokedAt,
    }).then(() => undefined, () => undefined)

    return NextResponse.json({ token: revokedToken })
  } catch {
    return NextResponse.json(
      { error: 'Failed to revoke setup token. Please retry.' },
      { status: 500 },
    )
  }
}

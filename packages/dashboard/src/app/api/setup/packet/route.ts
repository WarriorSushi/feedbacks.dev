import { NextRequest, NextResponse } from 'next/server'
import { buildAgentSetupPacket, verifyAgentSetupToken } from '@/lib/agent-setup'
import { createAdminSupabase } from '@/lib/supabase-server'
import { getProjectPublishableKey } from '@/lib/project-api-keys'
import type { Project } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'setup token is required' }, { status: 400 })
    }

    const payload = verifyAgentSetupToken(token)
    const admin = await createAdminSupabase()
    const { data: tokenRecord, error: tokenError } = await admin
      .from('agent_setup_tokens')
      .select('token_id, revoked_at, expires_at')
      .eq('token_id', payload.tokenId)
      .eq('project_id', payload.projectId)
      .eq('user_id', payload.userId)
      .maybeSingle()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Setup token is not registered or has been revoked.' }, { status: 401 })
    }

    if (tokenRecord.revoked_at) {
      return NextResponse.json({ error: 'Setup token has been revoked.' }, { status: 401 })
    }

    if (new Date(tokenRecord.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Setup token has expired.' }, { status: 401 })
    }

    const { data: project } = await admin
      .from('projects')
      .select('*')
      .eq('id', payload.projectId)
      .eq('owner_user_id', payload.userId)
      .single()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (payload.projectKey !== getProjectPublishableKey(project.id)) {
      return NextResponse.json(
        { error: 'Setup token no longer matches the active project key.' },
        { status: 401 },
      )
    }

    await admin.from('agent_setup_audit').insert({
      id: crypto.randomUUID(),
      project_id: payload.projectId,
      user_id: payload.userId,
      event_type: 'packet_read',
      expires_at: payload.expiresAt,
      metadata: {
        user_agent: request.headers.get('user-agent') || null,
      },
      created_at: new Date().toISOString(),
    }).then(() => undefined, () => undefined)

    return NextResponse.json(
      buildAgentSetupPacket(project as Project, payload.projectKey),
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid setup token' },
      { status: 401 },
    )
  }
}

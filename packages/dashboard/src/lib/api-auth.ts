import { NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { hashProjectApiKey, isPrivateProjectApiKey } from '@/lib/project-api-keys'
import type { Project } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SAFE_PROJECT_COLUMNS = 'id, owner_user_id, name, api_key_last_four, domain, webhooks, settings, environment, test_namespace, expires_at, quarantined_at, created_at, updated_at'

export type ProjectApiScope =
  | 'feedback:read'
  | 'feedback:write'
  | 'project:read'
  | 'project:write'
  | 'setup:read'

export async function authenticateApiKey(
  request: Request,
  requiredScope: ProjectApiScope,
): Promise<{ project: Project; apiKeyId: string; scopes: ProjectApiScope[] } | null> {
  const apiKey = request.headers.get('X-API-Key')?.trim()
  if (!apiKey || !isPrivateProjectApiKey(apiKey) || apiKey.length > 200) return null

  const admin = await createAdminSupabase()
  const keyHash = await hashProjectApiKey(apiKey)
  const { data: keyRecord } = await admin
    .from('project_api_keys')
    .select('id, project_id, scopes, expires_at, revoked_at, last_used_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (
    !keyRecord ||
    keyRecord.revoked_at ||
    (keyRecord.expires_at && new Date(keyRecord.expires_at).getTime() <= Date.now())
  ) {
    return null
  }

  const scopes = keyRecord.scopes as ProjectApiScope[]
  if (!scopes.includes(requiredScope)) {
    await admin.from('project_api_key_events').insert({
      project_id: keyRecord.project_id,
      api_key_id: keyRecord.id,
      event_type: 'rejected',
      metadata: { reason: 'missing_scope', required_scope: requiredScope },
    })
    return null
  }

  const { data: project } = await admin
    .from('projects')
    .select(SAFE_PROJECT_COLUMNS)
    .eq('id', keyRecord.project_id)
    .maybeSingle()

  if (!project) return null

  const lastUsedAt = keyRecord.last_used_at ? new Date(keyRecord.last_used_at).getTime() : 0
  if (Date.now() - lastUsedAt > 60 * 60 * 1000) {
    const usedAt = new Date().toISOString()
    await Promise.all([
      admin.from('project_api_keys').update({ last_used_at: usedAt }).eq('id', keyRecord.id),
      admin.from('project_api_key_events').insert({
        project_id: keyRecord.project_id,
        api_key_id: keyRecord.id,
        event_type: 'used',
        metadata: { scope: requiredScope },
        created_at: usedAt,
      }),
    ])
  }

  return { project: project as Project, apiKeyId: keyRecord.id, scopes }
}

type AuthResult =
  | { error: NextResponse }
  | { user: { id: string }; project: Project; admin: SupabaseClient }

/**
 * Get the authenticated user and verify they own the given project.
 * Returns the user, project, and admin client, or an error NextResponse.
 */
export async function getAuthedUserAndProject(projectId: string): Promise<AuthResult> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select(SAFE_PROJECT_COLUMNS)
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  return { user, project: project as Project, admin }
}

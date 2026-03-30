import { NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { hashProjectApiKey } from '@/lib/project-api-keys'
import type { Project } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function authenticateApiKey(
  request: Request
): Promise<{ project: Project } | null> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) return null

  const admin = await createAdminSupabase()

  const keyHash = await hashProjectApiKey(apiKey)
  const { data: project } = await admin
    .from('projects')
    .select('*')
    .eq('api_key_hash', keyHash)
    .single()

  if (!project) return null
  return { project: project as Project }
}

type AuthResult =
  | { error: NextResponse }
  | { user: { id: string }; project: Project; admin: SupabaseClient }

/**
 * Get the authenticated user and verify they own the given project.
 * Returns user, project, and admin client — or an error NextResponse.
 */
export async function getAuthedUserAndProject(projectId: string): Promise<AuthResult> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('owner_user_id', user.id)
    .single()

  if (error || !project) return { error: NextResponse.json({ error: 'Project not found' }, { status: 404 }) }
  return { user, project: project as Project, admin }
}

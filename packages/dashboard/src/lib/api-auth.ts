import { createAdminSupabase } from '@/lib/supabase-server'
import type { Project } from '@/lib/types'

export async function authenticateApiKey(
  request: Request
): Promise<{ project: Project } | null> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) return null

  const admin = await createAdminSupabase()
  const { data: project, error } = await admin
    .from('projects')
    .select('*')
    .eq('api_key', apiKey)
    .single()

  if (error || !project) return null
  return { project: project as Project }
}

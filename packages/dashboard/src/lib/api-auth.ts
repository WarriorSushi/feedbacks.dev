import { createAdminSupabase } from '@/lib/supabase-server'
import type { Project } from '@/lib/types'

/** Hash an API key with SHA-256 for storage/lookup */
async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function authenticateApiKey(
  request: Request
): Promise<{ project: Project } | null> {
  const apiKey = request.headers.get('X-API-Key')
  if (!apiKey) return null

  const admin = await createAdminSupabase()
  const keyHash = await hashApiKey(apiKey)
  const { data: project, error } = await admin
    .from('projects')
    .select('*')
    .eq('api_key_hash', keyHash)
    .single()

  if (error || !project) return null
  return { project: project as Project }
}

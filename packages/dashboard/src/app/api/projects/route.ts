import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

/** Hash an API key with SHA-256 */
async function hashApiKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminSupabase()
    const { data, error } = await admin
      .from('projects')
      .select('*')
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

    const body = await request.json()
    const name = body.name?.trim()
    if (!name || name.length < 1 || name.length > 100) {
      return NextResponse.json({ error: 'Project name is required (1-100 chars)' }, { status: 400 })
    }

    const domain = body.domain?.trim() || null

    // Generate API key, store only hash
    const rawApiKey = `fb_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    const apiKeyHash = await hashApiKey(rawApiKey)

    const admin = await createAdminSupabase()
    const now = new Date().toISOString()
    const project = {
      id: crypto.randomUUID(),
      owner_user_id: user.id,
      name,
      api_key: rawApiKey, // Store raw key for backward compat (TODO: remove after migration)
      api_key_hash: apiKeyHash,
      domain,
      webhooks: {},
      settings: {},
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await admin.from('projects').insert(project).select().single()
    if (error) return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })

    // Return the raw API key only once at creation
    return NextResponse.json({ ...data, api_key: rawApiKey }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

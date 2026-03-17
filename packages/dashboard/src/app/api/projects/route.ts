import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

    const admin = await createAdminSupabase()
    const now = new Date().toISOString()
    const project = {
      id: crypto.randomUUID(),
      owner_user_id: user.id,
      name,
      api_key: crypto.randomUUID(),
      domain,
      webhooks: {},
      settings: {},
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await admin.from('projects').insert(project).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

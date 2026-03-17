import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { authenticateApiKey } from '@/lib/api-auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  try {
    // Try API key auth first
    const apiAuth = await authenticateApiKey(request)
    if (apiAuth) {
      // API key only gives access to its own project
      return json({ data: [apiAuth.project] })
    }

    // Fall back to Supabase session auth
    try {
      const supabase = await createServerSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return jsonError('Unauthorized', 401)

      const admin = await createAdminSupabase()
      const { data: projects, error } = await admin
        .from('projects')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) return jsonError('Failed to fetch projects', 500)
      return json({ data: projects ?? [] })
    } catch {
      return jsonError('Unauthorized', 401)
    }
  } catch (err) {
    console.error('v1 projects GET error:', err)
    return jsonError('Internal server error', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { authenticateApiKey } from '@/lib/api-auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await authenticateApiKey(request)
    if (!auth) return jsonError('Invalid or missing API key', 401)
    if (auth.project.id !== id) return jsonError('Forbidden', 403)

    const admin = await createAdminSupabase()

    // Get feedback stats
    const { count: totalFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    const { count: newFeedback } = await admin
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'new')

    let byType: { type: string; count: number }[] = []
    let byStatus: { status: string; count: number }[] = []
    try {
      const typeRes = await admin.rpc('count_by_column', {
        table_name: 'feedback',
        column_name: 'type',
        filter_project_id: id,
      })
      if (typeRes.data) byType = typeRes.data
    } catch { /* rpc may not exist */ }
    try {
      const statusRes = await admin.rpc('count_by_column', {
        table_name: 'feedback',
        column_name: 'status',
        filter_project_id: id,
      })
      if (statusRes.data) byStatus = statusRes.data
    } catch { /* rpc may not exist */ }

    return json({
      project: auth.project,
      stats: {
        totalFeedback: totalFeedback ?? 0,
        newFeedback: newFeedback ?? 0,
        feedbackByType: byType,
        feedbackByStatus: byStatus,
      },
    })
  } catch (err) {
    console.error('v1 project detail error:', err)
    return jsonError('Internal server error', 500)
  }
}

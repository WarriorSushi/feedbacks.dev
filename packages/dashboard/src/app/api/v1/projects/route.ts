import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { assertFeatureAccess } from '@/lib/billing'
import { apiV1Error } from '@/lib/api-v1-response'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS })
}

function jsonError(message: string, status: number) {
  return apiV1Error(message, status, CORS_HEADERS)
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(request: NextRequest) {
  try {
    // Use API key auth only. Wildcard CORS routes have no cookie fallback.
    const apiAuth = await authenticateApiKey(request, 'project:read')
    if (!apiAuth) return jsonError('Invalid or missing API key', 401)

    const feature = await assertFeatureAccess(apiAuth.project.owner_user_id, 'apiAccess')
    if (!feature.allowed) return jsonError(feature.message, 403)

    // API key only gives access to its own project
    return json({ data: [apiAuth.project] })
  } catch (err) {
    console.error('v1 projects GET error:', err)
    return jsonError('Internal server error', 500)
  }
}

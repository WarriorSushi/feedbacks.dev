import { NextRequest, NextResponse } from 'next/server'
import { processWebhookJobs } from '@/lib/webhook-delivery'

function isAuthorized(request: NextRequest) {
  const secret = process.env.WEBHOOK_JOB_SECRET
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = typeof body.limit === 'number' ? Math.max(1, Math.min(100, body.limit)) : 20
    const processed = await processWebhookJobs({ limit })
    return NextResponse.json({ processed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

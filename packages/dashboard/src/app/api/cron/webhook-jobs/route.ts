import { NextRequest, NextResponse } from 'next/server'
import { processWebhookJobs } from '@/lib/webhook-delivery'

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const processed = await processWebhookJobs({ limit: 50 })
    return NextResponse.json({ processed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

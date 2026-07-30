import { NextRequest, NextResponse } from 'next/server'
import { isSafeE2EEnvironment } from '@/lib/e2e-environment'
import { readJsonBody } from '@/lib/api-request'

const WEBHOOK_KINDS = new Set(['slack', 'discord', 'generic', 'github'])

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.E2E_AUTH_BYPASS_SECRET
  return Boolean(secret) && request.headers.get('x-feedbacks-e2e-bypass') === secret
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  if (!isSafeE2EEnvironment()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { kind } = await params

  if (!WEBHOOK_KINDS.has(kind)) {
    return NextResponse.json({ error: 'Unknown webhook kind' }, { status: 404 })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bodyResult = await readJsonBody(request)
  if (!bodyResult.ok) return bodyResult.response
  const payload = bodyResult.data
  return NextResponse.json({
    ok: true,
    kind,
    receivedAt: new Date().toISOString(),
    payloadType: payload && typeof payload === 'object' ? 'json' : 'unknown',
    feedbacksTimestamp: request.headers.get('x-feedbacks-timestamp'),
    feedbacksSignature: request.headers.get('x-feedbacks-signature'),
  })
}

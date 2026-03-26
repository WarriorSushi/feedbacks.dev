import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_KINDS = new Set(['slack', 'discord', 'generic', 'github'])

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.E2E_AUTH_BYPASS_SECRET
  return Boolean(secret) && request.headers.get('x-feedbacks-e2e-bypass') === secret
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const { kind } = await params

  if (!WEBHOOK_KINDS.has(kind)) {
    return NextResponse.json({ error: 'Unknown webhook kind' }, { status: 404 })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  return NextResponse.json({
    ok: true,
    kind,
    receivedAt: new Date().toISOString(),
    payloadType: payload && typeof payload === 'object' ? 'json' : 'unknown',
  })
}

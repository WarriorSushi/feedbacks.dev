import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Edge rate limiting using Upstash Redis (recommended for serverless).
// Configure env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// Fallback: pass-through if not configured.
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/feedback')) {
    return NextResponse.next();
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    // @ts-ignore - non-standard on edge runtime
    (req as any).ip ||
    'unknown';

  const windowSeconds = 60;
  const maxRequests = 10;
  const key = `rate:v1:${ip}`;

  try {
    const res = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds)],
      ]),
      cache: 'no-store',
    });

    const results = (await res.json()) as Array<{ result: number }>;
    const current = results?.[0]?.result ?? 0;

    const headers: Record<string, string> = {
      'RateLimit-Limit': String(maxRequests),
      'RateLimit-Remaining': String(Math.max(0, maxRequests - current)),
      'RateLimit-Reset': String(windowSeconds),
    };

    if (current > maxRequests) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(windowSeconds),
          ...headers,
        },
      });
    }

    return NextResponse.next({ headers });
  } catch (_err) {
    // Fail-open on limiter errors
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/api/feedback'],
};

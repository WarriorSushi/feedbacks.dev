import { createAdminSupabase } from '@/lib/supabase-server'
import { hasE2EBypass } from '@/lib/e2e'
import { createHmac } from 'node:crypto'

interface RateLimitRpcResult {
  allowed?: unknown
  remaining?: unknown
}

function parseRateLimitResult(value: unknown, fallbackLimit: number): { allowed: boolean; remaining: number } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const result = value as RateLimitRpcResult
  if (typeof result.allowed !== 'boolean') return null
  const remaining = typeof result.remaining === 'number' && Number.isFinite(result.remaining)
    ? Math.max(0, Math.floor(result.remaining))
    : result.allowed
      ? Math.max(0, fallbackLimit - 1)
      : 0
  return { allowed: result.allowed, remaining }
}

async function checkRateLimitLegacy(
  request: Request,
  route: string,
  limit: number,
  windowMinutes: number,
  scope?: string,
): Promise<{ allowed: boolean; remaining: number }> {
  // Prefer x-vercel-forwarded-for (harder to spoof on Vercel), then x-forwarded-for, then x-real-ip
  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  if (!ip) {
    return { allowed: false, remaining: 0 }
  }

  const key = buildRateLimitKey(ip, scope)
  const admin = await createAdminSupabase()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString()

  await admin
    .from('rate_limits')
    .delete()
    .eq('key', key)
    .eq('route', route)
    .lt('created_at', windowStart)

  const { count } = await admin
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', key)
    .eq('route', route)
    .gte('created_at', windowStart)

  const current = count ?? 0

  if (current >= limit) {
    return { allowed: false, remaining: 0 }
  }

  await admin.from('rate_limits').insert({
    id: crypto.randomUUID(),
    key,
    route,
    created_at: now.toISOString(),
  })

  return { allowed: true, remaining: limit - current - 1 }
}

export async function checkRateLimit(
  request: Request,
  route: string,
  limit: number = 10,
  windowMinutes: number = 1,
  scope?: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (hasE2EBypass(request)) {
    return { allowed: true, remaining: limit }
  }

  // Prefer x-vercel-forwarded-for (harder to spoof on Vercel), then x-forwarded-for, then x-real-ip
  const ip =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  // Reject requests with no identifiable IP
  if (!ip) {
    return { allowed: false, remaining: 0 }
  }

  const key = buildRateLimitKey(ip, scope)
  const admin = await createAdminSupabase()
  const { data, error } = await admin.rpc('check_rate_limit', {
    p_key: key,
    p_route: route,
    p_limit: limit,
    p_window_seconds: Math.max(1, Math.round(windowMinutes * 60)),
  })

  const parsed = parseRateLimitResult(data, limit)
  if (!error && parsed) return parsed

  return checkRateLimitLegacy(request, route, limit, windowMinutes, scope)
}

function buildRateLimitKey(ip: string, scope?: string) {
  const secret =
    process.env.RATE_LIMIT_HMAC_SECRET ||
    process.env.VOTE_HMAC_SECRET ||
    process.env.BOARD_REPORT_SALT ||
    process.env.CRON_SECRET
  if (!secret) return `missing-secret:${scope || 'global'}`
  return createHmac('sha256', secret)
    .update(`${ip}\n${scope || 'global'}`)
    .digest('hex')
}

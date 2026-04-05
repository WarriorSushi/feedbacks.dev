import { createAdminSupabase } from '@/lib/supabase-server'
import { hasE2EBypass } from '@/lib/e2e'

export async function checkRateLimit(
  request: Request,
  route: string,
  limit: number = 10,
  windowMinutes: number = 1
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

  const key = ip
  const admin = await createAdminSupabase()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString()

  // Clean old entries and count recent
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

  // Record this request
  await admin.from('rate_limits').insert({
    id: crypto.randomUUID(),
    key,
    route,
    created_at: now.toISOString(),
  })

  return { allowed: true, remaining: limit - current - 1 }
}

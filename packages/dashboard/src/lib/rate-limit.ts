import { createAdminSupabase } from '@/lib/supabase-server'

export async function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMinutes: number = 1
): Promise<{ allowed: boolean; remaining: number }> {
  const admin = await createAdminSupabase()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000).toISOString()

  // Clean old entries and count recent
  await admin
    .from('rate_limits')
    .delete()
    .eq('ip', ip)
    .lt('created_at', windowStart)

  const { count } = await admin
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart)

  const current = count ?? 0

  if (current >= limit) {
    return { allowed: false, remaining: 0 }
  }

  // Record this request
  await admin.from('rate_limits').insert({
    id: crypto.randomUUID(),
    ip,
    created_at: now.toISOString(),
  })

  return { allowed: true, remaining: limit - current - 1 }
}

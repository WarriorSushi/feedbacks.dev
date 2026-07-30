import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), 'packages', 'dashboard', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const events = [
  ['project_created', 'Projects created'],
  ['install_code_copied', 'Install code copied'],
  ['verification_completed', 'Verification completed'],
  ['first_feedback_received', 'First feedback received'],
  ['first_feedback_triaged', 'First feedback triaged'],
  ['integration_connected', 'Integration connected'],
  ['updates_nav_opened', 'Updates opened'],
  ['updates_setup_started', 'Updates setup started'],
  ['updates_embed_verified', 'Updates embed verified'],
  ['updates_activated', 'Updates activated'],
  ['updates_first_draft_created', 'First update draft'],
  ['updates_first_published', 'First update published'],
  ['updates_first_impression_received', 'First update impression'],
]

const client = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function loadCounts(since) {
  const results = await Promise.all(events.map(async ([eventName, label]) => {
    let query = client
      .from('activation_milestones')
      .select('project_id', { count: 'exact', head: true })
      .eq('event_name', eventName)
      .eq('environment', 'production')
    if (since) query = query.gte('first_seen_at', since)
    const { count, error } = await query
    if (error) throw error
    return { eventName, label, count: count || 0 }
  }))

  const denominator = results.find((item) => item.eventName === 'project_created')?.count || 0
  return results.map((item) => ({
    milestone: item.label,
    projects: item.count,
    conversion: denominator > 0 ? `${Math.round((item.count / denominator) * 100)}%` : 'n/a',
  }))
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
const [lastSevenDays, lifetime] = await Promise.all([
  loadCounts(sevenDaysAgo),
  loadCounts(null),
])

console.log(`Activation funnel (last 7 days, since ${sevenDaysAgo.slice(0, 10)})`)
console.table(lastSevenDays)
console.log('Activation funnel (lifetime)')
console.table(lifetime)

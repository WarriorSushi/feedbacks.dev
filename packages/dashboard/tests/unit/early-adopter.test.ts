import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('Early Adopter lifecycle sends one stage-appropriate reminder and transitions cleanly', () => {
  const lifecycle = read('../../src/lib/early-adopter-lifecycle.ts')
  const cronRoute = read('../../src/app/api/cron/early-adopter/route.ts')
  const vercel = read('../../vercel.json')

  assert.match(lifecycle, /\.in\('status', \['active', 'grace', 'finishing'\]\)/)
  assert.match(lifecycle, /status: 'completed'/)
  assert.match(lifecycle, /status: 'removed'/)
  assert.match(lifecycle, /notice_type: noticeType/)
  assert.match(lifecycle, /claimError\?\.code === '23505'/)
  assert.match(lifecycle, /grace_final_week'[\s\S]*else if[\s\S]*grace_month_one'[\s\S]*else if[\s\S]*feedback_due'[\s\S]*else if[\s\S]*feedback_window_open'/)
  assert.match(cronRoute, /processEarlyAdopterLifecycle/)
  assert.match(cronRoute, /verifyBearerSecret/)
  assert.match(vercel, /api\/cron\/early-adopter/)
})

test('Early Adopter service emails explain rewards, deadlines, grace, completion, and data safety', () => {
  const notifications = read('../../src/lib/notifications.ts')
  const joinRoute = read('../../src/app/api/marketing/leads/route.ts')

  assert.match(notifications, /notifyEarlyAdopterWelcome/)
  assert.match(notifications, /Place \$\{input\.seatNumber\} of 100/)
  assert.match(notifications, /Pro month one activates automatically/)
  assert.match(notifications, /claim Pro month \$\{nextMonth\}/)
  assert.match(notifications, /two-month grace period/i)
  assert.match(notifications, /Final week to keep your Early Adopter place/)
  assert.match(notifications, /projects and feedback are never deleted/i)
  assert.match(notifications, /complet(?:ed|ing) all 12 months/i)
  assert.match(joinRoute, /membership\.alreadyJoined \|\| !membership\.seatNumber/)
  assert.match(joinRoute, /notifyEarlyAdopterWelcome\(\{ email, seatNumber: membership\.seatNumber \}\)/)
})

test('password, magic-link, OAuth, and already signed-in enrolments all link the reserved place', () => {
  const authPage = read('../../src/app/auth/page.tsx')
  const callback = read('../../src/app/auth/callback/route.ts')
  const activateRoute = read('../../src/app/api/early-adopter/activate/route.ts')
  const joinRoute = read('../../src/app/api/marketing/leads/route.ts')

  assert.match(authPage, /fetch\('\/api\/early-adopter\/activate', \{ method: 'POST' \}\)/)
  assert.match(callback, /activateEarlyAdopterMembership/)
  assert.match(activateRoute, /supabase\.auth\.getUser\(\)/)
  assert.match(activateRoute, /activateEarlyAdopterMembership\(user\.id, user\.email\)/)
  assert.match(joinRoute, /user\.email\.toLowerCase\(\) === email/)
})

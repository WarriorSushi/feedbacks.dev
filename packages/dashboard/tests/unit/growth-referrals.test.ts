import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('growth data is service-only and referral credit is atomic and one-time', () => {
  const migration = read('../../../../sql/056_growth_referrals_and_marketing.sql')

  for (const table of ['marketing_leads', 'marketing_conversion_events', 'user_acquisition', 'referral_programs', 'referral_signups']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, 'i'))
  }
  assert.match(migration, /unique references auth\.users\(id\)/i)
  assert.match(migration, /check \(inviter_user_id <> invited_user_id\)/i)
  assert.match(migration, /successful_referrals between 0 and 5/i)
  assert.match(migration, /for update;/i)
  assert.match(migration, /v_count = 5 and v_program\.reward_granted_at is null/i)
  assert.match(migration, /\+ interval '1 month'/i)
  assert.match(migration, /revoke execute on function public\.claim_referral_signup/i)
  assert.match(migration, /grant execute on function public\.claim_referral_signup\(uuid, text\)\s+to service_role/i)
  assert.match(migration, /revoke insert, update, delete on table public\.billing_accounts from anon, authenticated/i)
})

test('referral rewards mature after real activation and use layered risk signals', () => {
  const migration = read('../../../../sql/057_referral_and_downgrade_safeguards.sql')
  const reviewMigration = read('../../../../sql/060_referral_review_resolution.sql')
  const activationEvidenceMigration = read('../../../../sql/061_require_server_feedback_referral_activation.sql')
  const referrals = read('../../src/lib/referrals.ts')
  const inviteRoute = read('../../src/app/r/[code]/route.ts')

  assert.match(migration, /status in \('pending', 'qualified', 'review', 'rejected'\)/i)
  assert.match(migration, /invited_email_hash/i)
  assert.match(migration, /device_reuse/i)
  assert.match(migration, /network_velocity/i)
  assert.match(migration, /interval '24 hours'/i)
  assert.match(migration, /event_name in \('verification_completed', 'first_feedback_received'\)/i)
  assert.match(migration, /for update;/i)
  assert.match(migration, /revoke execute on function public\.register_referral_signup/i)
  assert.match(migration, /grant execute on function public\.qualify_referral_signup\(uuid\) to service_role/i)
  assert.match(migration, /'inviter_user_id', v_program\.user_id/i)
  assert.match(referrals, /p_user_id: result\.inviter_user_id/)
  assert.match(referrals, /createHmac\('sha256'/)
  assert.doesNotMatch(referrals, /networkPrefix[^\n]*\.insert/)
  assert.match(inviteRoute, /REFERRAL_DEVICE_COOKIE/)
  assert.match(referrals, /timingSafeEqual/)
  assert.match(referrals, /referralDeviceId[\s\S]*deviceHash/)
  assert.match(reviewMigration, /status <> 'review'/i)
  assert.match(reviewMigration, /set status = 'pending'/i)
  assert.match(reviewMigration, /qualify_referral_signup\(v_signup\.invited_user_id\)/i)
  assert.match(reviewMigration, /set status = 'rejected'/i)
  assert.match(reviewMigration, /revoke execute on function public\.resolve_referral_review/i)
  assert.match(reviewMigration, /grant execute on function public\.resolve_referral_review\(uuid, boolean\)\s+to service_role/i)
  assert.match(activationEvidenceMigration, /event_name = 'first_feedback_received'/i)
  assert.doesNotMatch(activationEvidenceMigration, /event_name\s+in\s*\([^)]*verification_completed/i)
  assert.match(activationEvidenceMigration, /revoke execute on function public\.qualify_referral_signup\(uuid\)/i)
})

test('client-reported verification does not directly trigger referral qualification', () => {
  const source = read('../../src/lib/activation-milestones.ts')
  assert.doesNotMatch(source, /eventName === 'verification_completed'\s*\|\|/)
  assert.match(source, /if \(eventName === 'first_feedback_received'\)/)
})

test('downgrades are reversible, preserve data, and freeze only excess projects', () => {
  const migration = read('../../../../sql/057_referral_and_downgrade_safeguards.sql')
  const lifecycle = read('../../src/lib/billing-lifecycle.ts')
  const billing = read('../../src/lib/billing.ts')
  const notifications = read('../../src/lib/notifications.ts')

  assert.match(migration, /grace_ends_at > grace_started_at/i)
  assert.match(migration, /plan_freeze_reason = 'downgrade'/i)
  assert.match(migration, /order by \(keep\.plan_frozen_at is null\) desc, keep\.updated_at desc/i)
  assert.match(migration, /set plan_frozen_at = null, plan_freeze_reason = null/i)
  assert.doesNotMatch(migration, /delete from public\.projects/i)
  assert.match(lifecycle, /3 \* 24 \* 60 \* 60 \* 1000/)
  assert.match(lifecycle, /accessEnd\.getTime\(\) - WARNING_WINDOW_MS/)
  assert.match(lifecycle, /grace_ends_at: accessEnd\.toISOString\(\)/)
  assert.match(lifecycle, /input\.billingStatus === 'cancelled'/)
  assert.match(lifecycle, /complimentaryStillActive/)
  assert.match(lifecycle, /complimentary_pro_until\.not\.is\.null/)
  assert.doesNotMatch(lifecycle, /periodEnd\.getTime\(\) \+ WARNING_WINDOW_MS/)
  assert.match(lifecycle, /billing_lifecycle_notices/)
  assert.match(lifecycle, /90 \* 24 \* 60 \* 60 \* 1000/)
  assert.match(lifecycle, /network_hash: null, device_hash: null/)
  assert.match(notifications, /Plan change notice, day \$\{input\.day\} of 3/)
  assert.match(notifications, /final three days|three days left|ends in three days/i)
  assert.doesNotMatch(notifications, /grace period|grace access/i)
  assert.match(billing, /account\.billing_status === 'cancelled'\) return 'pro'/)
})

test('advertising integrations remain consent-gated and outside customer widgets', () => {
  const measurement = read('../../src/components/marketing-measurement.tsx')
  const marketing = read('../../src/lib/marketing.ts')
  const widget = read('../../../widget/src/index.ts')

  assert.match(measurement, /choice !== 'granted'/)
  assert.match(measurement, /consent', 'default'/)
  assert.match(measurement, /ad_user_data: 'denied'/)
  assert.match(measurement, /eventID: detail\.eventId/)
  assert.match(measurement, /conversionId: detail\.eventId/)
  assert.match(marketing, /metadata: \{ conversion_id: args\.eventId \}/)
  assert.match(marketing, /event_id: args\.eventId/)
  assert.doesNotMatch(widget, /facebook|redditstatic|googletagmanager|fbq|rdt\(/i)
})

test('lead capture distinguishes email consent from advertising measurement', () => {
  const page = read('../../src/app/early-access/lead-form.tsx')
  const route = read('../../src/app/api/marketing/leads/route.ts')

  assert.match(page, /newsletterConsent/)
  assert.match(page, /Advertising measurement is controlled separately/)
  assert.match(route, /newsletterConsent !== true/)
  assert.match(route, /checkRateLimit\(request, 'marketing-lead'/)
  assert.match(route, /companyWebsite/)
  assert.match(route, /recordMarketingConversion/)
})

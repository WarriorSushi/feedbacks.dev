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

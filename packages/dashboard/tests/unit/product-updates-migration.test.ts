import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migration = new URL('../../../../sql/028_product_updates.sql', import.meta.url)
const versionedPublishMigration = new URL(
  '../../../../sql/053_versioned_product_update_publish.sql',
  import.meta.url,
)
const multipleCtasMigration = new URL(
  '../../../../sql/054_multiple_product_update_ctas.sql',
  import.meta.url,
)
const visibilityMigration = new URL(
  '../../../../sql/059_product_update_visibility_toggle.sql',
  import.meta.url,
)

test('product update migration preserves RLS, service-only RPCs, and atomic publish limits', async () => {
  const sql = await readFile(migration, 'utf8')

  for (const table of ['product_update_settings', 'product_updates', 'product_update_metrics']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'))
  }
  assert.match(sql, /security invoker set search_path = pg_catalog/gi)
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /revoke all on function public\.increment_product_update_metric[\s\S]+from public, anon, authenticated/i)
  assert.match(sql, /grant execute on function public\.publish_product_update[\s\S]+to service_role/i)
  assert.match(sql, /product_update_images/)
  assert.match(sql, /target\.published_at <= now\(\)/)
})

test('product updates store a bounded ordered CTA collection with legacy backfill', async () => {
  const sql = await readFile(multipleCtasMigration, 'utf8')

  assert.match(sql, /add column if not exists ctas jsonb/i)
  assert.match(sql, /jsonb_array_length\(ctas\) <= 4/i)
  assert.match(sql, /jsonb_build_object\('label', cta_label, 'url', cta_url\)/i)
})

test('product update publication rejects a stale editor inside the database lock', async () => {
  const sql = await readFile(versionedPublishMigration, 'utf8')

  assert.match(sql, /p_expected_updated_at timestamptz/i)
  assert.match(sql, /for update/i)
  assert.match(sql, /target\.updated_at <> p_expected_updated_at/i)
  assert.match(sql, /product update version conflict/i)
  assert.match(
    sql,
    /revoke all on function public\.publish_product_update\([\s\S]+service_role/i,
  )
})

test('release-note visibility is atomic, service-only, and independent from publication identity', async () => {
  const sql = await readFile(visibilityMigration, 'utf8')

  assert.match(sql, /add column if not exists is_enabled boolean not null default true/i)
  assert.match(sql, /set_product_update_visibility/i)
  assert.match(sql, /pg_advisory_xact_lock/i)
  assert.match(sql, /for update/i)
  assert.match(sql, /target\.updated_at <> p_expected_updated_at/i)
  assert.match(sql, /set is_enabled = p_enabled/i)
  assert.match(sql, /grant execute on function public\.set_product_update_visibility[\s\S]+to service_role/i)
  assert.doesNotMatch(
    sql.match(/create or replace function public\.set_product_update_visibility[\s\S]+?\$function\$/i)?.[0] || '',
    /published_at\s*=/i,
  )
})

test('every public product-update query excludes notes that are turned off', async () => {
  const routes = await Promise.all(
    [
      '../../src/app/api/widget/bootstrap/route.ts',
      '../../src/app/api/widget/updates/route.ts',
      '../../src/app/api/widget/updates/events/route.ts',
      '../../src/app/api/product-feedback/route.ts',
    ].map((route) => readFile(new URL(route, import.meta.url), 'utf8')),
  )

  for (const route of routes) {
    assert.match(route, /\.eq\(['"]is_enabled['"], true\)/)
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'

async function loadProductUpdates() {
  return import(new URL('../../../shared/src/product-updates.ts', import.meta.url).href)
}

test('product update activation event names are reserved in the shared contract', async () => {
  const { PRODUCT_UPDATE_ACTIVATION_EVENTS } = await loadProductUpdates()

  assert.deepEqual(PRODUCT_UPDATE_ACTIVATION_EVENTS, [
    'updates_nav_opened',
    'updates_setup_started',
    'updates_install_method_selected',
    'updates_embed_verified',
    'updates_activated',
    'updates_first_draft_created',
    'updates_private_test_opened',
    'updates_first_published',
    'updates_first_impression_received',
  ])
})

test('product update validation accepts safe content and rejects unsafe CTAs', async () => {
  const { sanitizeProductUpdateInput } = await loadProductUpdates()
  const valid = sanitizeProductUpdateInput({
    title: 'Faster exports', summary: 'Exports now run in the background.',
    highlights: ['Leave the page while an export runs'], ctaLabel: 'Try it', ctaUrl: '/exports',
  }, { requirePublishFields: true })
  assert.deepEqual(valid.errors, {})
  assert.equal(valid.data.ctaUrl, '/exports')

  for (const ctaUrl of ['//evil.example', 'javascript:alert(1)', 'data:text/html,hello', 'https://user:password@example.com']) {
    const invalid = sanitizeProductUpdateInput({ title: 'Valid', summary: 'Valid summary', ctaLabel: 'Open', ctaUrl }, { requirePublishFields: true })
    assert.ok(invalid.errors.cta)
  }
})

test('product update paths and lifecycle state follow the published rules', async () => {
  const { isProductUpdatePathEligible, deriveProductUpdateState, sanitizeProductUpdateSettings } = await loadProductUpdates()
  const settings = sanitizeProductUpdateSettings({ includePaths: ['/app'], excludePaths: ['/app/auth'] })
  assert.deepEqual(settings.errors, {})
  assert.equal(isProductUpdatePathEligible('/app/settings', settings.data as { includePaths: string[]; excludePaths: string[] }), true)
  assert.equal(isProductUpdatePathEligible('/application', settings.data as { includePaths: string[]; excludePaths: string[] }), false)
  assert.equal(isProductUpdatePathEligible('/app/auth/login', settings.data as { includePaths: string[]; excludePaths: string[] }), false)
  assert.equal(deriveProductUpdateState({ status: 'published', publishedAt: '2026-07-19T00:00:00.000Z' }, new Date('2026-07-18T00:00:00.000Z')), 'Scheduled')
  assert.equal(deriveProductUpdateState({ status: 'published', publishedAt: '2026-07-17T00:00:00.000Z', expiresAt: '2026-07-18T00:00:00.000Z' }, new Date('2026-07-18T00:00:00.000Z')), 'Expired')
})

test('settings validation keeps partial patches separate from invalid path data', async () => {
  const { sanitizeProductUpdateSettings } = await loadProductUpdates()
  const partial = sanitizeProductUpdateSettings({ autoShow: false })
  assert.deepEqual(partial.errors, {})
  assert.deepEqual(partial.data, { autoShow: false })
  const invalid = sanitizeProductUpdateSettings({ includePaths: ['https://example.com'] })
  assert.ok(invalid.errors.includePaths)
})

test('product update validation permits clearing an optional version label', async () => {
  const { sanitizeProductUpdateInput } = await loadProductUpdates()
  const result = sanitizeProductUpdateInput({ versionLabel: '', title: 'Title', summary: 'Summary' }, { requirePublishFields: true })
  assert.deepEqual(result.errors, {})
  assert.equal(result.data.versionLabel, undefined)
})

test('product update validation accepts up to four safe ordered CTAs', async () => {
  const { sanitizeProductUpdateInput } = await loadProductUpdates()
  const valid = sanitizeProductUpdateInput({
    title: 'Title',
    summary: 'Summary',
    ctas: [
      { label: 'Open dashboard', url: '/dashboard' },
      { label: 'Read docs', url: 'https://feedbacks.dev/docs' },
    ],
  }, { requirePublishFields: true })
  assert.deepEqual(valid.errors, {})
  assert.equal(valid.data.ctas?.length, 2)

  const tooMany = sanitizeProductUpdateInput({
    title: 'Title',
    summary: 'Summary',
    ctas: Array.from({ length: 5 }, (_, index) => ({
      label: `Button ${index}`,
      url: `/button-${index}`,
    })),
  }, { requirePublishFields: true })
  assert.ok(tooMany.errors.ctas)
})

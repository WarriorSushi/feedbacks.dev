import assert from 'node:assert/strict'
import test from 'node:test'

test('widget bootstrap public contract keeps modules independent', async () => {
  const { buildPublicWidgetConfig } = await import(new URL('../../../shared/src/widget-install.ts', import.meta.url).href)
  const { isWidgetBootstrapResponse } = await import(new URL('../../../shared/src/product-updates.ts', import.meta.url).href)
  const feedbackConfig = buildPublicWidgetConfig('fb_live_demo', {}, { appOrigin: 'https://feedbacks.dev' })
  const feedbackOnly = { configVersion: 2, modules: { feedback: true, updates: false }, feedbackConfig }
  const proFeedbackOnly = { ...feedbackOnly, feedbackConfig: { ...feedbackConfig, showPoweredBy: false } }
  const updatesOnly = { configVersion: 2, modules: { feedback: false, updates: true }, feedbackConfig, updates: { settings: { autoShow: true, displayDelayMs: 1500, theme: 'auto', accentColor: '#6366f1', includePaths: [], excludePaths: [], showPoweredBy: true }, updates: [] } }
  assert.equal(isWidgetBootstrapResponse(feedbackOnly), true)
  assert.equal(isWidgetBootstrapResponse(proFeedbackOnly), true)
  assert.equal(isWidgetBootstrapResponse(updatesOnly), true)
  assert.equal(isWidgetBootstrapResponse({ configVersion: 2, modules: { feedback: false, updates: true }, feedbackConfig }), false)
  assert.equal(isWidgetBootstrapResponse({ configVersion: 2, modules: { feedback: true, updates: false }, feedbackConfig, updates: updatesOnly.updates }), false)
  assert.equal(isWidgetBootstrapResponse({ configVersion: 2, modules: { feedback: false, updates: true }, feedbackConfig, updates: { settings: {}, updates: [] } }), false)
  assert.equal(isWidgetBootstrapResponse({ ...updatesOnly, updates: { ...updatesOnly.updates, settings: { ...updatesOnly.updates.settings, displayDelayMs: 31_000 } } }), false)
  assert.equal(isWidgetBootstrapResponse({ ...feedbackOnly, feedbackConfig: { ...feedbackConfig, privateKey: 'nope' } }), false)
  assert.equal(isWidgetBootstrapResponse({ ...feedbackOnly, feedbackConfig: { ...feedbackConfig, showPoweredBy: 'nope' } }), false)
  assert.equal(isWidgetBootstrapResponse({ configVersion: 1, modules: { feedback: true, updates: false }, feedbackConfig }), false)
})

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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

test('widget renders cached feedback before waiting for remote bootstrap', async () => {
  const source = await readFile(new URL('../../../widget/src/widget.ts', import.meta.url), 'utf8')
  const initializer = source.slice(
    source.indexOf('private async initializeModules'),
    source.indexOf('private hasActiveFeedbackDraft'),
  )

  assert.ok(initializer.indexOf('readCachedRemoteWidgetConfig') < initializer.indexOf('await this.loadBootstrap()'))
  assert.ok(initializer.indexOf('this.setupFeedbackPresentation()') < initializer.indexOf('await this.loadBootstrap()'))
  assert.match(initializer, /writeCachedRemoteWidgetConfig/)
  assert.match(initializer, /applyFeedbackConfiguration/)
})

test('widget applies saved configuration updates without polling', async () => {
  const source = await readFile(new URL('../../../widget/src/widget.ts', import.meta.url), 'utf8')

  assert.match(source, /window\.addEventListener\(FEEDBACKS_CONFIG_UPDATE_EVENT, this\.handleConfigUpdate\)/)
  assert.match(source, /this\.applyFeedbackConfiguration\(detail\.config, this\.feedbackEnabled\)/)
  assert.match(source, /this\.manualPresentation && this\.cfg\.embedMode !== 'inline'/)
  assert.doesNotMatch(source, /if \(this\.cfg\.embedMode === 'inline'\) return/)
})

test('widget defaults every new category picker to Idea', async () => {
  const source = await readFile(new URL('../../../widget/src/widget.ts', import.meta.url), 'utf8')

  assert.match(source, /private selectedCategory: CategoryType \| '' = 'idea'/)
  assert.match(source, /restoredDraft\.category\)[\s\S]*\? restoredDraft\.category as CategoryType[\s\S]*: 'idea'/)
})

test('custom triggers work when framework menus mount after widget initialization', async () => {
  const source = await readFile(new URL('../../../widget/src/widget.ts', import.meta.url), 'utf8')

  assert.match(source, /this\.triggerSelector = sel/)
  assert.match(source, /document\.addEventListener\('click', this\.handleDelegatedTriggerClick\)/)
  assert.match(source, /event\.target\.closest\(this\.triggerSelector\)/)
  assert.match(source, /document\.removeEventListener\('click', this\.handleDelegatedTriggerClick\)/)
})

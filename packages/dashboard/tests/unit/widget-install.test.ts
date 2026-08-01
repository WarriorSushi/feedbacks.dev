import test from 'node:test'
import assert from 'node:assert/strict'

async function loadWidgetInstall() {
  return import(new URL('../../../shared/src/widget-install.ts', import.meta.url).href)
}

test('widget editor config applies canonical defaults used by runtime and snippets', async () => {
  const {
    buildRuntimeWidgetConfig,
    buildWidgetEditorConfig,
    generateInstallSnippets,
    getWidgetExpectation,
    getWidgetModeLabel,
  } = await loadWidgetInstall()

  const editorConfig = buildWidgetEditorConfig('fb_live_demo', {}, { appOrigin: 'https://feedbacks.dev' })

  assert.equal(editorConfig.embedMode, 'modal')
  assert.equal(editorConfig.position, 'bottom-right')
  assert.equal(editorConfig.buttonText, 'Feedback')
  assert.equal(editorConfig.enableType, true)
  assert.equal(editorConfig.enableRating, true)
  assert.equal(editorConfig.enableScreenshot, false)
  assert.equal(editorConfig.requireEmail, false)
  assert.equal(editorConfig.formTitle, 'Send Feedback')
  assert.equal(editorConfig.messagePlaceholder, "What's on your mind?")

  const runtimeConfig = buildRuntimeWidgetConfig('fb_live_demo', editorConfig, {
    appOrigin: 'https://feedbacks.dev',
  })
  assert.equal(getWidgetModeLabel(runtimeConfig), 'Modal')
  assert.equal(
    getWidgetExpectation(runtimeConfig),
    'Look for the floating "Feedback" launcher near the lower-right corner.',
  )

  const websiteSnippet = generateInstallSnippets({
    projectKey: 'fb_live_demo',
    savedConfig: editorConfig,
    appOrigin: 'https://feedbacks.dev',
  }).find((snippet: { label: string }) => snippet.label === 'Website')?.code

  assert.ok(websiteSnippet)
  assert.match(websiteSnippet, /src="https:\/\/feedbacks\.dev\/widget\/latest\.js"/)
  assert.match(websiteSnippet, /data-project="fb_live_demo"/)
  assert.match(websiteSnippet, /data-feedbacks-host="fb_live_demo"/)
  assert.doesNotMatch(websiteSnippet, /data-api-url=/)
  assert.doesNotMatch(websiteSnippet, /data-button-text=/)
})

test('widget expectation reflects non-default trigger and modal positioning', async () => {
  const {
    buildRuntimeWidgetConfig,
    getWidgetExpectation,
    getWidgetModeLabel,
  } = await loadWidgetInstall()

  const triggerConfig = buildRuntimeWidgetConfig(
    'fb_live_demo',
    {
      embedMode: 'trigger',
      buttonText: 'Report issue',
    },
    { appOrigin: 'https://feedbacks.dev' },
  )
  assert.equal(getWidgetModeLabel(triggerConfig), 'Trigger')
  assert.equal(
    getWidgetExpectation(triggerConfig),
    'Click "Report issue" to open the feedback form from your trigger element.',
  )

  const modalConfig = buildRuntimeWidgetConfig(
    'fb_live_demo',
    {
      position: 'top-left',
      buttonText: 'Share feedback',
    },
    { appOrigin: 'https://feedbacks.dev' },
  )
  assert.equal(
    getWidgetExpectation(modalConfig),
    'Look for the floating "Share feedback" launcher near the upper-left corner.',
  )
})

test('widget targets preserve supported CSS selectors', async () => {
  const { normalizeWidgetTarget } = await loadWidgetInstall()
  assert.equal(normalizeWidgetTarget('#feedback', '#fallback'), '#feedback')
  assert.equal(normalizeWidgetTarget('.feedback-button', '#fallback'), '.feedback-button')
  assert.equal(normalizeWidgetTarget('[data-feedback]', '#fallback'), '[data-feedback]')
  assert.equal(normalizeWidgetTarget('feedback', '#fallback'), '#feedback')
})

test('install snippets stay stable when remotely managed settings change', async () => {
  const { buildRuntimeWidgetConfig, generateInstallSnippets } = await loadWidgetInstall()
  const config = buildRuntimeWidgetConfig('fb_live_demo', {
    enableUpdates: true,
    embedMode: 'inline',
    buttonText: 'Report a bug',
    requireEmail: true,
    requireCaptcha: true,
    captchaProvider: 'turnstile',
    turnstileSiteKey: 'public-site-key',
  }, { appOrigin: 'https://feedbacks.dev' })
  assert.equal(config.updatesApiUrl, 'https://feedbacks.dev/api/widget/updates')
  const snippets = generateInstallSnippets({ projectKey: 'fb_live_demo', savedConfig: config, appOrigin: 'https://feedbacks.dev' })
  const websiteSnippet = snippets.find((snippet: { label: string }) => snippet.label === 'Website')?.code || ''
  const reactSnippet = snippets.find((snippet: { label: string }) => snippet.label === 'React')?.code || ''
  assert.doesNotMatch(websiteSnippet, /data-enable-updates|data-embed-mode|data-require-email|site-key|Report a bug/)
  assert.doesNotMatch(reactSnippet, /embedMode|requireEmail|turnstile|Report a bug/)
  assert.match(reactSnippet, /projectKey="fb_live_demo"/)
})

test('server module preference survives customization without leaking into install markup', async () => {
  const {
    generateInstallSnippets,
    mergeOwnerEditableWidgetConfig,
    sanitizeSavedWidgetConfig,
  } = await loadWidgetInstall()
  const saved = sanitizeSavedWidgetConfig({ feedbackEnabled: false, buttonText: 'Contact us' })
  assert.equal(saved.feedbackEnabled, false)

  const merged = mergeOwnerEditableWidgetConfig(
    { feedbackEnabled: false, enableUpdates: true, buttonText: 'Old label' },
    { feedbackEnabled: true, enableUpdates: false, buttonText: 'New label' },
  )
  assert.equal(merged.feedbackEnabled, false)
  assert.equal(merged.enableUpdates, true)
  assert.equal(merged.buttonText, 'New label')

  const websiteSnippet = generateInstallSnippets({
    projectKey: 'fb_live_demo',
    savedConfig: saved,
    appOrigin: 'https://feedbacks.dev',
  }).find((snippet: { label: string }) => snippet.label === 'Website')?.code

  assert.ok(websiteSnippet)
  assert.doesNotMatch(websiteSnippet, /feedback-enabled/i)
})

test('public widget config is fully resolved and rejects private or unknown fields', async () => {
  const { buildPublicWidgetConfig, isPublicWidgetConfig } = await loadWidgetInstall()
  const config = buildPublicWidgetConfig('fb_live_demo', {
    feedbackEnabled: false,
    enableUpdates: true,
    embedMode: 'trigger',
    buttonText: 'Report issue',
    requireCaptcha: true,
    captchaProvider: 'turnstile',
    turnstileSiteKey: 'browser-public-key',
  }, { appOrigin: 'https://feedbacks.dev' })

  assert.equal(config.embedMode, 'trigger')
  assert.equal(config.buttonText, 'Report issue')
  assert.equal(config.apiUrl, 'https://feedbacks.dev/api/feedback')
  assert.equal(config.turnstileSiteKey, 'browser-public-key')
  assert.equal('feedbackEnabled' in config, false)
  assert.equal('enableUpdates' in config, false)
  assert.equal(isPublicWidgetConfig(config), true)
  assert.equal(isPublicWidgetConfig({ ...config, feedbackEnabled: true }), false)
  assert.equal(isPublicWidgetConfig({ ...config, serviceRoleKey: 'never-public' }), false)
  assert.equal(isPublicWidgetConfig({ ...config, apiUrl: 'javascript:alert(1)' }), false)
})

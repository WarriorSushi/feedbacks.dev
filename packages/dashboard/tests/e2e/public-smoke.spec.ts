import { expect, test } from '@playwright/test'

test('public acquisition, auth, and documentation routes render', async ({ page }) => {
  for (const route of ['/', '/auth', '/docs']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response?.ok(), `${route} should return a successful response`).toBeTruthy()
    await expect(page.locator('main')).toBeVisible()
  }
})

test('widget stays usable when bootstrap is unavailable', async ({ page }) => {
  await page.route('**/api/widget/bootstrap**', (route) => route.abort('failed'))
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const runtime = await page.request.get('/widget/latest.js')
  expect(runtime.ok()).toBeTruthy()
  expect(await runtime.text()).toContain('FeedbacksWidget')

  await page.addScriptTag({ url: '/widget/latest.js' })
  await page.evaluate(() => {
    const widgetRuntime = (window as typeof window & {
      FeedbacksWidget?: { init(config: Record<string, unknown>): unknown }
    }).FeedbacksWidget
    if (!widgetRuntime) throw new Error('Widget runtime did not initialize')
    widgetRuntime.init({
      projectKey: 'browser-smoke-project',
      apiUrl: `${window.location.origin}/api/feedback`,
    })
  })

  const launcher = page.locator('.fb-launcher')
  await expect(launcher).toBeVisible({ timeout: 1_000 })
  await launcher.click()
  await expect(page.getByRole('dialog', { name: 'Send Feedback' })).toBeVisible()
})

import { expect, test } from '@playwright/test'

test('public acquisition, auth, and documentation routes render', async ({ page }) => {
  for (const route of ['/', '/auth', '/docs']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response?.ok(), `${route} should return a successful response`).toBeTruthy()
    await expect(page.locator('main')).toBeVisible()
  }
})

test('optional measurement stays off until consent and withdrawal clears attribution', async ({ page }) => {
  test.skip(
    !process.env.NEXT_PUBLIC_GOOGLE_TAG_ID
      && !process.env.NEXT_PUBLIC_META_PIXEL_ID
      && !process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID,
    'Optional marketing providers are not configured in this environment',
  )

  await page.context().addCookies([{
    name: 'feedbacks_attribution',
    value: 'test-attribution',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    httpOnly: true,
    sameSite: 'Lax',
  }])

  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const choices = page.getByRole('dialog', { name: 'Cookie and advertising measurement choices' })
  await expect(choices).toBeVisible()
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0)
  await expect(choices.getByRole('button', { name: 'Reject optional' })).toBeVisible()
  await expect(choices.getByRole('button', { name: 'Allow optional' })).toBeVisible()

  await choices.getByRole('button', { name: 'Reject optional' }).click()
  await expect(choices).toBeHidden()
  await expect.poll(async () => page.context().cookies()).not.toContainEqual(
    expect.objectContaining({ name: 'feedbacks_attribution' }),
  )
  await expect.poll(async () => page.context().cookies()).toContainEqual(
    expect.objectContaining({ name: 'feedbacks_marketing_consent', value: 'v1.denied' }),
  )

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(choices).toBeHidden()
  await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0)
})

test('widget stays usable when bootstrap is unavailable', async ({ page }) => {
  await page.context().addCookies([{
    name: 'feedbacks_marketing_consent',
    value: 'v1.denied',
    url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    sameSite: 'Lax',
  }])
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

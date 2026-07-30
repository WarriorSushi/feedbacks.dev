import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectVerifyPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('renders the live widget and accepts a test submission', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Verify ${Date.now().toString(36)}` })

  await page.goto(projectVerifyPath(project.id))
  const widgetRuntimeResponse = await page.request.fetch('/widget/latest.js')

  await expect(page.getByRole('navigation', { name: 'Setup steps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Verify one test' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Three quick checks' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Send one test message.' })).toBeVisible()
  expect(widgetRuntimeResponse.ok()).toBeTruthy()
  await expect(page.getByText(/Ready/i)).toBeVisible({ timeout: 30_000 })
  const launcher = page.locator('.fb-launcher')
  await expect(launcher).toBeVisible()

  await launcher.click()
  await expect(page.getByRole('dialog', { name: 'Send Feedback' })).toBeVisible()

  const message = `Install verification for ${project.name}`
  await page.getByLabel(/Your feedback/).fill(message)
  await page.getByLabel('Email (optional)').fill('tester@example.com')
  const feedbackResponse = page.waitForResponse((response) => {
    return response.url().includes('/api/feedback')
      && response.request().method() === 'POST'
      && response.status() === 201
  })
  await page.getByRole('button', { name: 'Send Feedback' }).click()
  await feedbackResponse
  await expect(page.getByText('Verification reached the inbox')).toBeVisible()
  await page.getByRole('link', { name: 'Open verified item' }).click()
  await expect(page).toHaveURL(/\/feedback\/[^/]+/, { timeout: 30_000 })
  await expect(page.getByText(message)).toBeVisible()
})

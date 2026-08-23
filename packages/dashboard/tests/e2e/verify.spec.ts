import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectVerifyPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('verifies a real product submission and keeps the hosted form as troubleshooting', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Verify ${Date.now().toString(36)}` })

  await page.goto(projectVerifyPath(project.id))
  const widgetRuntimeResponse = await page.request.fetch('/widget/latest.js')

  await expect(page.getByRole('navigation', { name: 'Setup steps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Test it in your product' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Send feedback from where your users will.' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Customize feedback form' })).toBeVisible()
  expect(widgetRuntimeResponse.ok()).toBeTruthy()
  await expect(page.getByText('Waiting for a new feedback item…')).toBeVisible()
  const launcher = page.locator('.fb-launcher')
  await expect(launcher).toHaveCount(0)

  const message = `Install verification for ${project.name}`
  const realSubmission = await page.request.post('/api/feedback', {
    data: {
      apiKey: project.apiKey,
      message,
      url: page.url(),
      userAgent: 'Playwright account-menu product verification',
    },
  })
  expect(realSubmission.ok(), await realSubmission.text()).toBeTruthy()
  await expect(page.getByText('Test feedback arrived from your product')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Saved changes reach the installed form automatically')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Customize this form' })).toHaveAttribute('href', `/projects/${project.id}/feedback-form`)
  await expect(page.getByRole('link', { name: 'Open inbox item' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Feedback inbox/ }).getByText('1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Dismiss customization reminder' }).click()
  await expect(page.getByRole('link', { name: 'Customize this form' })).toHaveCount(0)

  await page.getByText('Troubleshooting: test the saved form here').click()
  await expect(launcher).toBeVisible()

  await launcher.click()
  await expect(page.getByRole('dialog', { name: 'Send Feedback' })).toBeVisible()

  const controlMessage = `Hosted control for ${project.name}`
  await page.getByLabel(/Your feedback/).fill(controlMessage)
  await page.getByLabel('Email (optional)').fill('tester@example.com')
  const feedbackResponse = page.waitForResponse((response) => {
    return response.url().includes('/api/feedback')
      && response.request().method() === 'POST'
      && response.status() === 201
  })
  await page.getByRole('button', { name: 'Send Feedback' }).click()
  await feedbackResponse
  await expect(page.getByText('Hosted form reached the inbox. Your saved form works.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Feedback inbox/ }).getByText('2', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Open control item' }).click()
  await expect(page).toHaveURL(/\/feedback\/[^/]+/, { timeout: 30_000 })
  await expect(page.getByText(controlMessage)).toBeVisible()
})

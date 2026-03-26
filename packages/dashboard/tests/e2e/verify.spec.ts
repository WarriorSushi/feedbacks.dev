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

  await expect(page.getByRole('heading', { name: new RegExp(`Verify ${project.name}`) })).toBeVisible()
  await expect(page.getByText('Verification checklist')).toBeVisible()
  await expect(page.getByText('Live verification surface')).toBeVisible()
  expect(widgetRuntimeResponse.ok()).toBeTruthy()
  await expect(page.getByText(/The widget runtime is ready/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Feedback' })).toBeVisible()

  await page.getByRole('button', { name: 'Feedback' }).click()
  await expect(page.getByRole('dialog', { name: 'Send Feedback' })).toBeVisible()

  const message = `Install verification for ${project.name}`
  await page.getByLabel(/Your feedback/).fill(message)
  await page.getByLabel('Email (optional)').fill('tester@example.com')
  await page.getByRole('button', { name: 'Send Feedback' }).click()

  await expect(page.getByText('Your feedback has been sent successfully.')).toBeVisible()
  await page.getByRole('link', { name: 'Open project inbox' }).first().click()
  await expect(page).toHaveURL(new RegExp(`/feedback\\?projectId=${project.id}`))
  await expect(page.getByText(message)).toBeVisible()
})

import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('creates a project and lands on a stable one-time embed installation', async ({ page }) => {
  await signInWithTestSession(page)

  await page.goto('/projects/new')
  await page.getByLabel('App or website name').fill(`Playwright Install ${Date.now().toString(36)}`)
  await page.getByRole('button', { name: 'Create project and get the snippet' }).click()

  await expect(page).toHaveURL(/\/projects\/[^/]+\/install\?created=1/, { timeout: 30_000 })
  await expect(page.getByRole('navigation', { name: 'Setup steps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Install feedback' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose your stack' })).toBeVisible()
  await expect(page.getByText('Step 1 of 3')).toBeVisible()
  await page.getByText('Other', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'WordPress' })).toBeVisible()
  await page.getByRole('button', { name: 'HTML block' }).click()
  await expect(page.getByText(/Prefer global custom code/i)).toBeVisible()

  await page.goto(page.url().replace(/\/install(?:\?.*)?$/, '/feedback-form'))
  await expect(page.getByRole('heading', { name: 'Feedback form' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Live form preview' })).toBeVisible()
})

test('copy-paste install guidance stays visible for an existing project', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Install API ${Date.now().toString(36)}` })

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Install feedback' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose your stack' })).toBeVisible()
  await expect(
    page.getByText(/Paste before the closing body tag/i),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByTestId('install-verify-instruction'),
  ).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('link', { name: /verification/i })).toBeVisible()
  await page.getByText('Other', { exact: true }).click()
  await page.getByRole('button', { name: 'Mobile app' }).click()
  await expect(page.getByText(/browser script does not run inside native/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open API docs' })).toBeVisible()
})

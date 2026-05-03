import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('creates a project and lands on customization before install', async ({ page }) => {
  await signInWithTestSession(page)

  await page.goto('/projects/new')
  await page.getByLabel('Project Name *').fill(`Playwright Install ${Date.now().toString(36)}`)
  await page.getByRole('button', { name: 'Create Project' }).click()

  await expect(page).toHaveURL(/\/projects\/[^/]+\?created=1&tab=customize/, { timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Customize', exact: true })).toBeVisible()
  await expect(page.getByText('Start by choosing how the widget should appear.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Make the feedback form fit your product' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Live form preview' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Floating button Adds a small/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Your own button Attach the/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Form on a page Embed the whole/ })).toBeVisible()

  await page.getByRole('button', { name: 'Install', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Install the saved widget you just designed' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy Website snippet' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open verification page' })).toBeVisible()
  await expect(page.getByText('1. Copy the Website snippet.')).toBeVisible()
  await expect(page.getByText('2. Verify one test message.')).toBeVisible()
  await expect(page.getByText('3. Confirm it lands in the inbox.')).toBeVisible()
})

test('copy-paste install guidance stays visible for an existing project', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Install API ${Date.now().toString(36)}` })

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('heading', { name: 'Install the saved widget you just designed' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recommended install' })).toBeVisible()
  await expect(
    page.getByText(/Paste the snippet into your site where global scripts load/i),
  ).toBeVisible({ timeout: 30_000 })
  await expect(
    page.getByText(/Look for the floating "Feedback" launcher near the lower-right corner/i).first(),
  ).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('link', { name: 'Open verification page' })).toBeVisible()
})

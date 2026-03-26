import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('creates a project and lands on install with the first-run checklist', async ({ page }) => {
  await signInWithTestSession(page)

  await page.goto('/projects/new')
  await page.getByLabel('Project Name *').fill(`Playwright Install ${Date.now().toString(36)}`)
  await page.getByRole('button', { name: 'Create Project' }).click()

  await expect(page).toHaveURL(/\/projects\/[^/]+\?created=1/)
  await expect(page.getByRole('button', { name: 'Install' })).toBeVisible()
  await expect(page.getByText('Project created')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy Website snippet' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open verification page' })).toBeVisible()
  await expect(page.getByText('1. Copy the Website snippet')).toBeVisible()
  await expect(page.getByText('2. Open the verification page and submit a test item')).toBeVisible()
  await expect(page.getByText('3. Check your inbox to confirm the feedback arrived')).toBeVisible()
})

test('copy-paste install guidance stays visible for an existing project', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Install API ${Date.now().toString(36)}` })

  await page.goto(projectInstallPath(project.id))

  await expect(page.getByRole('heading', { name: 'Recommended install' })).toBeVisible()
  await expect(page.getByText('Where this goes')).toBeVisible()
  await expect(page.getByText('What you should see next')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open verification page' })).toBeVisible()
})

import { expect, test, skipE2EIfNeeded } from './fixtures'
import type { Page } from '@playwright/test'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectVerifyPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

async function updateModules(
  page: Page,
  projectId: string,
  modules: { feedback: boolean; updates: boolean },
) {
  const response = await page.request.patch(`/api/projects/${projectId}/modules`, { data: modules })
  const payload = await response.json().catch(() => null)
  expect(response.ok(), JSON.stringify(payload)).toBeTruthy()
  return payload as { feedback: boolean; updates: boolean }
}

async function bootstrap(page: Page, projectKey: string) {
  const response = await page.request.get(`/api/widget/bootstrap?projectKey=${encodeURIComponent(projectKey)}&runtimeVersion=e2e`)
  const payload = await response.json().catch(() => null)
  expect(response.ok(), JSON.stringify(payload)).toBeTruthy()
  return payload as {
    modules: { feedback: boolean; updates: boolean }
    updates?: { updates: Array<{ id: string; title: string }> }
  }
}

test('new Updates-only user verifies the embed, tests a draft, and publishes', async ({ page }) => {
  await signInWithTestSession(page)

  await page.goto('/projects/new?goal=updates')
  await page.getByLabel('App or website name').fill(`Playwright Updates ${Date.now().toString(36)}`)
  await page.getByRole('button', { name: 'Create project and write an update' }).click()
  await expect(page).toHaveURL(/\/projects\/([^/]+)\/release-notes$/, { timeout: 30_000 })

  const projectId = page.url().match(/\/projects\/([^/]+)\/release-notes$/)?.[1]
  expect(projectId).toBeTruthy()
  const projectKey = await page.evaluate((id) => window.sessionStorage.getItem(`feedbacks:project-api-key:${id}`), projectId!)
  expect(projectKey).toBeTruthy()

  const initialBootstrap = await bootstrap(page, projectKey!)
  expect(initialBootstrap.modules).toEqual({ feedback: false, updates: true })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Create first update' }).click()
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/release-notes/new$`))

  const title = `Shipped ${Date.now().toString(36)}`
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Summary').fill('A concise release update created by the required end-to-end release gate.')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByRole('button', { name: 'Test', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Test', exact: true }).click()
  const privateTest = page.getByRole('dialog', { name: 'Private release note test' })
  await expect(privateTest).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close private test' })).toBeFocused()
  await expect(privateTest.getByText(title)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(privateTest).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Test', exact: true })).toBeFocused()

  await page.getByRole('button', { name: 'Publish now' }).click()
  await expect(page.getByRole('heading', { name: 'Published successfully' })).toBeVisible()

  const publishedBootstrap = await bootstrap(page, projectKey!)
  expect(publishedBootstrap.modules).toEqual({ feedback: false, updates: true })
  expect(publishedBootstrap.updates?.updates.some((update) => update.title === title)).toBeTruthy()
})

test('an existing Feedback installation activates updates for users without a snippet change', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Remote Activation ${Date.now().toString(36)}` })

  const before = await bootstrap(page, project.apiKey)
  expect(before.modules).toEqual({ feedback: true, updates: false })

  await page.goto(`/projects/${project.id}/release-notes`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Your shared embed is connected' })).toBeVisible()
  await expect(page.getByText('Your existing installation does not need a code change.')).toBeVisible()
  await page.getByRole('button', { name: 'Activate updates for users' }).click()
  await expect(page.getByRole('button', { name: 'Create first update' })).toBeVisible()

  const after = await bootstrap(page, project.apiKey)
  expect(after.modules).toEqual({ feedback: true, updates: true })
})

test('Updates-only never renders the Feedback launcher', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Updates Only ${Date.now().toString(36)}` })
  expect(await updateModules(page, project.id, { feedback: false, updates: true })).toEqual({ feedback: false, updates: true })

  await page.goto(projectVerifyPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/Ready/i)).toBeVisible({ timeout: 30_000 })
  await page.waitForTimeout(2_000)
  await expect(page.locator('.fb-launcher')).toHaveCount(0)

  await page.route('**/api/widget/bootstrap**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"temporary"}' }))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/Ready/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.fb-launcher')).toHaveCount(0)
})

test('a bootstrap failure preserves an existing Feedback installation', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Bootstrap Fallback ${Date.now().toString(36)}` })
  await page.route('**/api/widget/bootstrap**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"temporary"}' }))

  await page.goto(projectVerifyPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.fb-launcher')).toBeVisible({ timeout: 30_000 })
})

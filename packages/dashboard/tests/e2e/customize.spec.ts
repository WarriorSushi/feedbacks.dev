import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectCustomizePath, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('publishes saved feedback-form changes remotely without changing install code', async ({ page }) => {
  test.setTimeout(180_000)
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Customize ${Date.now().toString(36)}` })

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()

  await expect(
    page.getByText(/without replacing the installed snippet/i),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Live form preview' })).toBeVisible()
  await expect(page.getByText(/Placement, color, copy, and optional fields update/i)).toBeVisible()
  await expect(page.getByText('app.example.com')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Custom trigger Connects feedback/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Inline form Embeds the full/ })).toBeVisible()
  await expect(page.getByLabel('Widget embed mode')).toHaveCount(0)
  await page.getByLabel('Button text').fill('Ideas')
  await expect(page.getByLabel('Button text')).toHaveValue('Ideas')
  await expect(
    page.getByText(/Preview the draft, then save once/i),
  ).toBeVisible()
  await expect(page.getByText(/Unsaved changes: Button text/i)).toBeVisible()
  await expect(page.getByText(/Previewing unsaved changes/i)).toBeVisible()
  await expect(page.getByText(/Publish remote changes/i)).toBeVisible()
  await expect
    .poll(async () => {
      return page.evaluate((storageKey) => window.sessionStorage.getItem(storageKey), `feedbacks-widget-draft:${project.id}`)
    })
    .not.toBeNull()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('install-verify-instruction')).not.toContainText('Ideas')
  await expect(page.locator('[data-tour="install-code"]')).not.toContainText('Ideas')

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()
  await expect(page.getByLabel('Button text')).toHaveValue('Ideas')
  await expect(
    page.getByText(/Preview the draft, then save once/i),
  ).toBeVisible()
  await expect(page.getByText(/Previewing unsaved changes/i)).toBeVisible()

  const saveResponse = page.waitForResponse((response) => {
    return response.url().includes(`/api/projects/${project.id}`)
      && response.request().method() === 'PATCH'
      && response.status() === 200
  })
  await page.getByRole('button', { name: 'Save changes' }).first().click()
  await saveResponse
  await expect(
    page.getByText(/without replacing the installed snippet/i),
  ).toBeVisible()

  const bootstrapResponse = await page.request.get(`/api/widget/bootstrap?projectKey=${encodeURIComponent(project.apiKey)}&runtimeVersion=e2e`)
  expect(bootstrapResponse.ok()).toBeTruthy()
  const bootstrap = await bootstrapResponse.json()
  expect(bootstrap.feedbackConfig.buttonText).toBe('Ideas')
  expect(bootstrap.feedbackConfig.feedbackEnabled).toBeUndefined()
  expect(bootstrap.feedbackConfig.enableUpdates).toBeUndefined()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('install-verify-instruction')).toContainText('Ideas')
  await expect(page.locator('[data-tour="install-code"]')).not.toContainText('Ideas')
})

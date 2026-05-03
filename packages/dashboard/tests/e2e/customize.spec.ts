import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectCustomizePath, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('keeps customize drafts local until the user saves them', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Customize ${Date.now().toString(36)}` })

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()

  await expect(
    page.getByText(/This is the saved version that install snippets and hosted verification will use/i),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Live form preview' })).toBeVisible()
  await expect(page.getByText(/See the opened form, not just the button/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Your own button Attach the/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Form on a page Embed the whole/ })).toBeVisible()
  await page.getByLabel('Button Text').fill('Ideas')
  await expect(page.getByLabel('Button Text')).toHaveValue('Ideas')
  await expect(
    page.getByText(/Save it when the form looks right, then install that exact saved version/i),
  ).toBeVisible()
  await expect(page.getByText(/Draft changes: Button text/i)).toBeVisible()
  await expect(page.getByText(/Previewing unsaved changes/i)).toBeVisible()
  await expect
    .poll(async () => {
      return page.evaluate((storageKey) => window.sessionStorage.getItem(storageKey), `feedbacks-widget-draft:${project.id}`)
    })
    .not.toBeNull()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/floating "Feedback" launcher/i).first()).toBeVisible()
  await expect(page.getByText(/floating "Ideas" launcher/i)).toHaveCount(0)

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()
  await expect(page.getByLabel('Button Text')).toHaveValue('Ideas')
  await expect(
    page.getByText(/Save it when the form looks right, then install that exact saved version/i),
  ).toBeVisible()
  await expect(page.getByText(/Previewing unsaved changes/i)).toBeVisible()

  const saveResponse = page.waitForResponse((response) => {
    return response.url().includes(`/api/projects/${project.id}`)
      && response.request().method() === 'PATCH'
      && response.status() === 200
  })
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await saveResponse
  await expect(
    page.getByText(/This is the saved version that install snippets and hosted verification will use/i),
  ).toBeVisible()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/floating "Ideas" launcher/i).first()).toBeVisible()
})

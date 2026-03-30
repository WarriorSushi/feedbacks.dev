import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi, projectCustomizePath, projectInstallPath } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('keeps customize drafts local until the user saves them', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Customize ${Date.now().toString(36)}` })

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByText(/Install snippets, hosted verify, and this preview are currently aligned/i),
  ).toBeVisible()
  await page.getByLabel('Button Text').fill('Ideas')
  await expect(
    page.getByText(/Install snippets and the hosted verify page still use the last saved config until you save changes here/i),
  ).toBeVisible()
  await expect(page.getByText(/Draft changes: Button text/i)).toBeVisible()
  await expect(page.getByText(/Previewing unsaved changes/i)).toBeVisible()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/floating "Feedback" button/i).first()).toBeVisible()
  await expect(page.getByText(/floating "Ideas" button/i)).toHaveCount(0)

  await page.goto(projectCustomizePath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/A local unsaved draft was restored for this project/i)).toBeVisible()

  const saveResponse = page.waitForResponse((response) => {
    return response.url().includes(`/api/projects/${project.id}`)
      && response.request().method() === 'PATCH'
      && response.status() === 200
  })
  await page.getByRole('button', { name: 'Save Changes' }).click()
  await saveResponse
  await expect(
    page.getByText(/Install snippets, hosted verify, and this preview are currently aligned/i),
  ).toBeVisible()

  await page.goto(projectInstallPath(project.id), { waitUntil: 'domcontentloaded' })
  await expect(page.getByText(/floating "Ideas" button/i).first()).toBeVisible()
})

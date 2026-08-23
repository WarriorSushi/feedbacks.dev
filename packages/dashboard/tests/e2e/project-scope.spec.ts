import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('project switcher keeps dashboard and inbox scope explicit', async ({ page }) => {
  await signInWithTestSession(page)
  const first = await createProjectViaApi(page, { name: `Scope Alpha ${Date.now().toString(36)}` })
  const second = await createProjectViaApi(page, { name: `Scope Beta ${Date.now().toString(36)}` })

  await page.goto(`/dashboard?project=${first.id}`)
  await expect(page.getByTestId('dashboard-current-project-scope')).toHaveText(first.name)

  await page.getByRole('button', { name: 'Switch project' }).click()
  await page.getByRole('link', { name: new RegExp(second.name) }).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard\\?project=${second.id}`))
  await expect(page.getByTestId('dashboard-current-project-scope')).toHaveText(second.name)
  await expect(page.getByTestId('dashboard-current-project-scope')).toHaveAttribute('aria-current', 'page')

  await page.getByTestId('dashboard-all-projects-scope').click()
  await expect(page).toHaveURL(/\/dashboard\?scope=all/)
  await expect(page.getByTestId('dashboard-all-projects-scope')).toHaveAttribute('aria-current', 'page')

  const projectOverview = page.getByRole('link', { name: 'Project overview' })
  await expect(projectOverview).toHaveAttribute('href', `/projects/${second.id}`)
  await projectOverview.click()
  await expect(page).toHaveURL(new RegExp(`/projects/${second.id}$`))
  await expect(page.getByRole('heading', { name: 'Project overview' })).toBeVisible()
})

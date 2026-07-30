import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('API docs are visible on Free and start with quick submit guidance', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright API ${Date.now().toString(36)}` })

  await page.goto(`/projects/${project.id}/api`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()
  await expect(page).toHaveURL(`/projects/${project.id}/api`)

  await expect(page.getByRole('heading', { name: 'API and MCP' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Connection details' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Quick start: submit feedback' })).toBeVisible()
  await expect(page.getByText(/Do not expose this key in public browser code/i)).toBeVisible()
  await expect(page.getByText('/api/v1/projects', { exact: true })).toHaveCount(1)
  await expect(page.getByText(/API and MCP access are part of Pro/i)).toHaveCount(0)
})

import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { seedDirectoryBoards } from './helpers/board'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('shows the public directory and category filters with realistic board activity', async ({ page }) => {
  await signInWithTestSession(page)
  const boards = await seedDirectoryBoards(page)

  await page.goto('/boards')
  await expect(page.getByRole('heading', { name: /Browse boards/i })).toBeVisible()
  await expect(page.locator('a[href*="sort=trending"]').first()).toBeVisible()
  const analyticsFilter = page.locator('a[href*="category=analytics"]').first()
  const firstBoardLink = page.locator(`a[href="/p/${boards.firstBoard.slug}"]`).first()
  const secondBoardLink = page.locator(`a[href="/p/${boards.secondBoard.slug}"]`).first()
  await expect(analyticsFilter).toBeVisible()
  await expect(firstBoardLink).toBeVisible()
  await expect(secondBoardLink).toBeVisible()

  await analyticsFilter.click()
  await expect(page).toHaveURL(/category=analytics/)
  await expect(firstBoardLink).toBeVisible()
})

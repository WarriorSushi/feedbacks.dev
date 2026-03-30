import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { seedDirectoryBoards } from './helpers/board'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('shows the public directory and category filters with realistic board activity', async ({ page }) => {
  await signInWithTestSession(page)
  const boards = await seedDirectoryBoards(page)

  await page.goto('/boards', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-board-directory-ready="true"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Discover Feedback Boards/i })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trending' })).toBeVisible()
  const analyticsFilter = page.getByRole('button', { name: 'analytics' })
  const firstBoardLink = page.locator(`a[href="/p/${boards.firstBoard.slug}"]`)
  const secondBoardLink = page.locator(`a[href="/p/${boards.secondBoard.slug}"]`)
  await expect(analyticsFilter).toBeVisible()
  await expect(firstBoardLink).toBeVisible()
  await expect(secondBoardLink).toBeVisible()

  await analyticsFilter.click()
  await expect(firstBoardLink).toBeVisible()
  await expect(secondBoardLink).toHaveCount(0)
})

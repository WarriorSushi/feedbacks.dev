import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'
import { saveBoardSettings, submitBoardFeedback } from './helpers/board'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('supports public replies, status changes, and hiding a board item', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Moderation ${Date.now().toString(36)}` })
  const board = await saveBoardSettings(page, project, {
    slug: `playwright-${Date.now().toString(36)}-moderation`,
    title: 'Moderation board',
    description: 'Acceptance board for trust and moderation flows.',
    categories: ['trust', 'operations'],
  })

  const feedback = await submitBoardFeedback(page, project, board, {
    message: 'The export flow needs a clearer success message before shipping.',
    type: 'idea',
  })

  await page.goto(board.url)
  await page.getByRole('button', { name: 'Details' }).click()
  await expect(page.getByText('Post public reply')).toBeVisible()

  const replyText = `We are on it ${Date.now().toString(36)}`
  await page.locator('textarea[placeholder="Share a public update or clarify the plan."]').fill(replyText)
  await page.getByRole('button', { name: 'Post public reply' }).click()
  await expect(page.getByText(replyText)).toBeVisible()

  await page.getByLabel('Update status').selectOption('in_progress')
  await expect(page.getByLabel('Update status')).toHaveValue('in_progress')

  await page.getByRole('button', { name: 'Hide from board' }).click()

  await expect(page.getByText('The export flow needs a clearer success message before shipping.')).toHaveCount(0)
})

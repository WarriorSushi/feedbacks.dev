import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'
import { saveBoardSettings, submitBoardFeedback, submitDuplicateBoardFeedback } from './helpers/board'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('publishes a board and exercises duplicate and spam submission checks', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Board ${Date.now().toString(36)}` })
  const board = await saveBoardSettings(page, project, {
    slug: `playwright-${Date.now().toString(36)}-board`,
    title: 'Playwright board',
    description: 'Acceptance board for submission flows.',
    categories: ['developer-tools', 'testing'],
  })

  await page.goto(board.url)
  await expect(page.getByRole('heading', { name: 'Playwright board' })).toBeVisible()
  await page.getByRole('button', { name: 'Submit feedback' }).first().click()
  const submitDialog = page.getByRole('dialog', { name: 'Submit feedback' })
  await expect(submitDialog).toBeVisible()

  const uniqueMessage = `Need clearer setup guidance ${Date.now().toString(36)}`
  await submitDialog.getByLabel(/Your feedback/).fill(uniqueMessage)
  await submitDialog.getByRole('button', { name: 'Submit feedback' }).click()
  await expect(submitDialog).toHaveCount(0)
  await expect(page.getByText(uniqueMessage)).toBeVisible()

  const duplicate = await submitDuplicateBoardFeedback(page, project, board, uniqueMessage)
  expect(duplicate.status).toBe(409)
  expect(duplicate.payload.suggestions).toBeTruthy()

  const spam = await page.request.post(`/api/boards/${board.slug}/submit`, {
    data: {
      apiKey: project.apiKey,
      message: 'Buy cheap pills buy cheap pills buy cheap pills buy cheap pills buy cheap pills',
      type: 'idea',
      email: 'tester@example.com',
      hp: 'bot',
    },
  })
  expect(spam.status()).toBe(400)
})

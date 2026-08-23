import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

test('bulk feedback actions recover from stale rows and keep notifications clear of the action bar', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Bulk ${Date.now().toString(36)}` })

  const feedbackIds: string[] = []
  for (const message of ['First bulk item', 'Second bulk item']) {
    const response = await page.request.post('/api/feedback', {
      data: {
        apiKey: project.apiKey,
        message: `${message} for ${project.name}`,
        type: 'idea',
        url: 'https://example.com/inbox-bulk-test',
        userAgent: 'Playwright bulk feedback test',
      },
    })
    const payload = await response.json()
    expect(response.ok(), JSON.stringify(payload)).toBeTruthy()
    feedbackIds.push(payload.id)
  }

  await page.goto(`/feedback?projectId=${project.id}`)
  await expect(page.getByText(`First bulk item for ${project.name}`)).toBeVisible()
  await page.getByRole('checkbox', { name: 'Select all feedback on this page' }).check()

  const actionBar = page.getByRole('region', { name: 'Bulk feedback actions' })
  await expect(actionBar).toBeVisible()

  await page.route('**/api/feedback/bulk', (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Mark read' }).click()
  await expect(page.getByText('Could not mark read')).toBeVisible()
  await expect.poll(async () => {
    const toastBox = await page.locator('[data-toast-viewport]').boundingBox()
    const actionBarBox = await actionBar.boundingBox()
    if (!toastBox || !actionBarBox) return -1
    return Math.round(actionBarBox.y - (toastBox.y + toastBox.height))
  }).toBeGreaterThanOrEqual(8)
  await page.getByRole('button', { name: 'Dismiss notification' }).click()
  await page.unroute('**/api/feedback/bulk')

  const externalDelete = await page.request.delete('/api/feedback/bulk', {
    data: { ids: [feedbackIds[0]] },
  })
  expect(externalDelete.ok(), await externalDelete.text()).toBeTruthy()

  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  const deleteResponse = page.waitForResponse((response) => (
    response.url().includes('/api/feedback/bulk')
      && response.request().method() === 'DELETE'
  ))
  await page.getByRole('button', { name: 'Delete permanently' }).click()
  expect((await deleteResponse).ok()).toBeTruthy()

  await expect(page.getByText('Your inbox is empty')).toBeVisible()
  await expect(page.getByText('1 feedback item deleted')).toBeVisible()
  await expect(page.getByText('1 selected item was already gone and has been removed from this inbox.')).toBeVisible()
  await expect(actionBar).toHaveCount(0)
})

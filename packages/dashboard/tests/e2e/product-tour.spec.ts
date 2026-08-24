import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

const TOUR_STEP_TIMEOUT_MS = 60_000

const tourSteps = [
  { title: 'Understand the feedback loop', path: /\/dashboard(?:\?.*)?$/, target: 'nav-dashboard' },
  { title: 'Know which project you are changing', path: /\/dashboard(?:\?.*)?$/, target: 'project-switcher' },
  { title: 'Make the workspace comfortable', path: /\/dashboard(?:\?.*)?$/, target: 'theme-switcher' },
  { title: 'Choose how customers open the form', path: /\/dashboard(?:\?.*)?$/, target: 'widget-placement' },
  { title: 'Match the launcher to your product', path: /\/dashboard(?:\?.*)?$/, target: 'widget-appearance' },
  { title: 'Ask for a useful message', path: /\/dashboard(?:\?.*)?$/, target: 'widget-content' },
  { title: 'Add fields only when they earn their place', path: /\/dashboard(?:\?.*)?$/, target: 'widget-protection' },
  { title: 'Preview before you save', path: /\/dashboard(?:\?.*)?$/, target: 'widget-preview' },
  { title: 'Choose the install guide for your app', path: /\/dashboard(?:\?.*)?$/, target: 'install-platforms' },
  { title: 'Install once, then verify with a real test', path: /\/dashboard(?:\?.*)?$/, target: 'install-code' },
  { title: 'Turn messages into decisions', path: /\/dashboard(?:\?.*)?$/, target: 'inbox-filters' },
  { title: 'Use each feedback type differently', path: /\/dashboard(?:\?.*)?$/, target: 'inbox-list' },
  { title: 'Close the loop with product updates', path: /\/dashboard(?:\?.*)?$/, target: 'nav-updates' },
  { title: 'Use a public board for shared demand', path: /\/dashboard(?:\?.*)?$/, target: 'nav-boards' },
  { title: 'Route high-signal work to your team', path: /\/dashboard(?:\?.*)?$/, target: 'integration-endpoint' },
  { title: 'Run your first complete loop', path: /\/dashboard(?:\?.*)?$/, target: 'dashboard-capabilities' },
]

test.describe('product tour', () => {
  test('walks every navigation step and finishes on the dashboard', async ({ page }) => {
    test.setTimeout(300_000)
    await signInWithTestSession(page)
    await page.goto('/dashboard?tour=1')

    const welcome = page.getByRole('dialog')
    await expect(welcome.getByRole('heading', { name: 'Learn feedbacks.dev with a guided tour.' })).toBeVisible()
    await welcome.getByRole('button', { name: 'Start product tour' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    for (const [index, step] of tourSteps.entries()) {
      await expect(dialog.getByRole('heading', { name: step.title, exact: true })).toBeVisible({
        timeout: TOUR_STEP_TIMEOUT_MS,
      })
      await expect(page).toHaveURL(step.path, { timeout: TOUR_STEP_TIMEOUT_MS })

      const visibleTarget = page.locator(`[data-tour-demo-root] [data-tour="${step.target}"]:visible`)
      await expect(visibleTarget).toBeVisible({ timeout: TOUR_STEP_TIMEOUT_MS })

      if (index < tourSteps.length - 1) {
        await page.getByRole('button', { name: 'Next', exact: true }).click()
      }
    }

    await page.getByRole('button', { name: 'Finish', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('walks every mobile step without covering the highlighted menu item', async ({ page }) => {
    test.setTimeout(300_000)
    await signInWithTestSession(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/dashboard?tour=1')

    const welcome = page.getByRole('dialog')
    await expect(welcome.getByRole('heading', { name: 'Learn feedbacks.dev with a guided tour.' })).toBeVisible()
    await welcome.getByRole('button', { name: 'Start product tour' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    for (const [index, step] of tourSteps.entries()) {
      await expect(dialog.getByRole('heading', { name: step.title, exact: true })).toBeVisible({
        timeout: TOUR_STEP_TIMEOUT_MS,
      })
      await expect(page).toHaveURL(step.path, { timeout: TOUR_STEP_TIMEOUT_MS })

      const target = page.locator(`[data-tour-demo-root] [data-tour="${step.target}"]:visible`)
      await expect(target).toBeVisible({ timeout: TOUR_STEP_TIMEOUT_MS })

      const [dialogBox, targetBox] = await Promise.all([dialog.boundingBox(), target.boundingBox()])
      expect(dialogBox).not.toBeNull()
      expect(targetBox).not.toBeNull()

      const overlaps = Boolean(
        dialogBox &&
        targetBox &&
        dialogBox.x < targetBox.x + targetBox.width &&
        dialogBox.x + dialogBox.width > targetBox.x &&
        dialogBox.y < targetBox.y + targetBox.height &&
        dialogBox.y + dialogBox.height > targetBox.y
      )
      expect(overlaps).toBe(false)

      if (index < tourSteps.length - 1) {
        await page.getByRole('button', { name: 'Next', exact: true }).click()
      }
    }

    await page.getByRole('button', { name: 'Finish', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(dialog).toBeHidden()
  })
})

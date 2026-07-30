import AxeBuilder from '@axe-core/playwright'
import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const responsiveViewports = [
  { width: 320, height: 700, label: 'compact phone' },
  { width: 390, height: 844, label: 'phone' },
  { width: 768, height: 1024, label: 'tablet' },
  { width: 1024, height: 768, label: 'small desktop' },
  { width: 1440, height: 900, label: 'desktop' },
]

function materialViolations(result: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return result.violations.filter((violation) =>
    violation.impact === 'moderate'
    || violation.impact === 'serious'
    || violation.impact === 'critical',
  )
}

test('public acquisition and documentation routes reflow across the release viewport matrix', async ({ page }) => {
  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport)
    for (const route of ['/', '/auth', '/docs']) {
      await page.goto(route)
      await expect(page.locator('main')).toBeVisible()
      const result = await new AxeBuilder({ page })
        .include('main')
        .withTags(wcagTags)
        .analyze()
      expect(
        materialViolations(result),
        `Accessibility violations on ${route} at ${viewport.label}`,
      ).toEqual([])

      const sizes = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }))
      expect(
        sizes.content,
        `Horizontal overflow on ${route} at ${viewport.label}`,
      ).toBeLessThanOrEqual(sizes.viewport)
    }
  }
})

test('public routes preserve visible keyboard focus and reduced-motion behavior', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await page.keyboard.press('Tab')
  await expect(page.locator(':focus-visible')).toBeVisible()

  const motion = await page.evaluate(() => ({
    rootScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    maxDurationMs: Math.max(
      0,
      ...Array.from(document.querySelectorAll('*')).flatMap((element) => {
        const style = getComputedStyle(element)
        return `${style.animationDuration},${style.transitionDuration}`
          .split(',')
          .map((duration) => duration.trim())
          .map((duration) => duration.endsWith('ms')
            ? Number.parseFloat(duration)
            : Number.parseFloat(duration) * 1000)
          .filter(Number.isFinite)
      }),
    ),
  }))
  expect(motion.rootScrollBehavior).not.toBe('smooth')
  expect(motion.maxDurationMs).toBeLessThanOrEqual(0.1)
})

for (const route of ['/dashboard', '/feedback']) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await signInWithTestSession(page)
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()

    const result = await new AxeBuilder({ page })
      .include('main')
      .withTags(wcagTags)
      .analyze()
    expect(materialViolations(result)).toEqual([])
  })
}

test('dashboard and inbox do not overflow a mobile viewport', async ({ page }) => {
  await signInWithTestSession(page)
  await page.setViewportSize({ width: 390, height: 844 })

  for (const route of ['/dashboard', '/feedback']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
  }
})

test('Updates setup is accessible and fits a mobile viewport', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Accessible Updates ${Date.now().toString(36)}` })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/projects/${project.id}/release-notes`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Show what changed inside your product' })).toBeVisible()

  const result = await new AxeBuilder({ page })
    .include('main')
    .withTags(wcagTags)
    .analyze()
  expect(materialViolations(result)).toEqual([])

  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport)
})

test('install, verify, customize, billing, settings, and API workflows meet the material WCAG gate at 320px', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Accessible Core ${Date.now().toString(36)}` })
  await page.setViewportSize({ width: 320, height: 700 })
  const routes = [
    `/projects/${project.id}/install`,
    `/projects/${project.id}/verify`,
    `/projects/${project.id}?tab=customize`,
    `/projects/${project.id}?tab=board`,
    `/projects/${project.id}?tab=api`,
    '/billing',
    '/settings',
  ]

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible()
    const result = await new AxeBuilder({ page })
      .include('main')
      .withTags(wcagTags)
      .analyze()
    expect(materialViolations(result), `Accessibility violations on ${route}`).toEqual([])
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }))
    expect(sizes.content, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(sizes.viewport)
  }
})

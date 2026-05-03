import { expect, test, skipE2EIfNeeded } from './fixtures'
import { createClient } from '@supabase/supabase-js'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

type Delivery = {
  id: string
  kind: 'slack' | 'discord' | 'generic' | 'github'
  status: 'success' | 'failed'
}

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

const WEBHOOK_KINDS = ['slack', 'discord', 'generic', 'github'] as const

async function setBillingPlan(userId: string, plan: 'free' | 'pro') {
  const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
  const now = new Date().toISOString()
  const { error } = await admin
    .from('billing_accounts')
    .upsert(
      {
        user_id: userId,
        plan_tier: plan,
        billing_status: plan === 'pro' ? 'active' : 'free',
        cancel_at_period_end: false,
        updated_at: now,
        created_at: now,
      },
      { onConflict: 'user_id', ignoreDuplicates: false },
    )

  if (error) {
    throw new Error(`Failed to set billing plan: ${error.message}`)
  }
}

async function readDeliveries(page: import('@playwright/test').Page, projectId: string) {
  const response = await page.request.get(`/api/projects/${projectId}/webhooks/deliveries`)
  const payload = await response.json().catch(() => null)
  if (!response.ok() || !payload) {
    throw new Error(`Failed to load deliveries: ${response.status()} ${JSON.stringify(payload)}`)
  }
  return (payload.deliveries || []) as Delivery[]
}

async function waitForDeliveries(
  page: import('@playwright/test').Page,
  projectId: string,
  predicate: (deliveries: Delivery[]) => boolean,
  timeoutMs = 30_000,
) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const deliveries = await readDeliveries(page, projectId)
    if (predicate(deliveries)) return deliveries
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  const finalDeliveries = await readDeliveries(page, projectId)
  throw new Error(`Timed out waiting for webhook deliveries: ${JSON.stringify(finalDeliveries)}`)
}

test('configures endpoints, sends tests, and replays deliveries from the integrations UI', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Webhooks ${Date.now().toString(36)}` })

  await page.goto(`/projects/${project.id}?tab=integrations`)
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()

  const placeholders = {
    slack: 'https://hooks.slack.com/services/...',
    discord: 'https://discord.com/api/webhooks/...',
    generic: 'https://example.com/webhooks/feedback',
  } as const

  for (const kind of ['slack', 'discord', 'generic'] as const) {
    const section = page.locator(`[data-webhook-kind="${kind}"]`)
    await section.getByRole('button', { name: 'Add endpoint' }).click()
    await page
      .locator(`[data-webhook-kind="${kind}"] input[placeholder="${placeholders[kind]}"]`)
      .fill(`${env.appOrigin}/api/test/webhook-target/${kind}`)
  }

  const githubSection = page.locator('[data-webhook-kind="github"]')
  await githubSection.getByRole('button', { name: 'Add endpoint' }).click()
  await page.locator('[data-webhook-kind="github"] input[placeholder="owner/repo"]').fill('feedbacks/e2e-webhooks')
  await page.locator('[data-webhook-kind="github"] input[placeholder="github_pat_..."]').fill(env.authBypassSecret)

  const saveResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/projects/${project.id}/webhooks`)
    && response.request().method() === 'PUT',
  )
  await page.getByRole('button', { name: 'Save Integrations' }).click()
  expect((await saveResponse).status()).toBe(200)

  const getResponse = await page.request.get(`/api/projects/${project.id}/webhooks`)
  expect(getResponse.ok()).toBe(true)
  const savedConfig = await getResponse.json()
  expect(savedConfig.slack?.endpoints).toHaveLength(1)
  expect(savedConfig.discord?.endpoints).toHaveLength(1)
  expect(savedConfig.generic?.endpoints).toHaveLength(1)
  expect(savedConfig.github?.endpoints).toHaveLength(1)

  for (const kind of WEBHOOK_KINDS) {
    const section = page.locator(`[data-webhook-kind="${kind}"]`)
    const testResponse = page.waitForResponse((response) =>
      response.url().includes(`/api/projects/${project.id}/webhooks`)
      && response.request().method() === 'POST',
    )
    await section.getByRole('button', { name: 'Send test' }).click()
    expect((await testResponse).status()).toBe(200)
  }

  const deliveries = await waitForDeliveries(
    page,
    project.id,
    (items) => {
      const successByKind = new Map<string, boolean>()
      for (const item of items) {
        if (item.status === 'success') successByKind.set(item.kind, true)
      }
      return WEBHOOK_KINDS.every((kind) => successByKind.get(kind))
    },
  )

  expect(deliveries.filter((d) => d.status === 'success').length).toBeGreaterThanOrEqual(4)

  for (const kind of WEBHOOK_KINDS) {
    const replayResponse = page.waitForResponse((response) =>
      response.url().includes(`/api/projects/${project.id}/webhooks`)
      && response.request().method() === 'POST',
    )
    await page.locator(`[data-delivery-kind="${kind}"]`).first().getByRole('button', { name: 'Resend' }).click()
    expect((await replayResponse).status()).toBe(200)
  }

  await waitForDeliveries(
    page,
    project.id,
    (items) => WEBHOOK_KINDS.every((kind) =>
      items.filter((d) => d.kind === kind && d.status === 'success').length >= 2,
    ),
  )
})

test('integrations UI shows saved endpoints', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright UI Webhooks ${Date.now().toString(36)}` })

  // Save config via API first
  await page.request.put(`/api/projects/${project.id}/webhooks`, {
    data: {
      slack: {
        endpoints: [{
          id: 'slack-ui',
          url: `${env.appOrigin}/api/test/webhook-target/slack`,
          enabled: true, delivery: 'immediate', format: 'full',
        }],
      },
    },
  })

  // Navigate to integrations tab and verify UI shows the endpoint
  await page.goto(`/projects/${project.id}?tab=integrations`)
  await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Route important feedback where your team already works' })).toBeVisible()

  // The slack section should show the saved endpoint with a "Send test" button
  const slackSection = page.locator('[data-webhook-kind="slack"]')
  await expect(slackSection.getByRole('button', { name: 'Send test' })).toBeVisible()
})

test('free plan opens integrations without requesting forbidden delivery logs', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Free Webhooks ${Date.now().toString(36)}` })
  const summaryResponse = await page.request.get('/api/billing/sync')
  expect(summaryResponse.ok()).toBe(true)
  const summary = await summaryResponse.json()
  const userId = summary.account.user_id as string

  try {
    await setBillingPlan(userId, 'free')
    const deliveriesPath = `/api/projects/${project.id}/webhooks/deliveries`

    await page.goto(`/projects/${project.id}?tab=integrations`)
    await expect(page.locator('[data-project-tabs-ready="true"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Unlock delivery logs, replay, and live routing with Pro' })).toBeVisible()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const deliveryRequests = await page.evaluate((path) => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => entry.name.includes(path))
        .map((entry) => entry.name)
    }, deliveriesPath)

    expect(deliveryRequests).toEqual([])
  } finally {
    await setBillingPlan(userId, 'pro')
  }
})

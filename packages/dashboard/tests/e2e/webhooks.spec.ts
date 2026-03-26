import { expect, test, skipE2EIfNeeded } from './fixtures'
import { signInWithTestSession } from './helpers/auth'
import { createProjectViaApi } from './helpers/project'

type Delivery = {
  id: string
  kind: 'slack' | 'discord' | 'generic' | 'github'
  status: 'success' | 'failed'
}

const env = skipE2EIfNeeded()
test.skip(!env.ready, env.skipReason)

/** Kinds we can fully validate with a local test target */
const LOCAL_KINDS = ['slack', 'discord', 'generic'] as const

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

test('saves webhook config and sends test deliveries via API', async ({ page }) => {
  await signInWithTestSession(page)
  const project = await createProjectViaApi(page, { name: `Playwright Webhooks ${Date.now().toString(36)}` })

  // Save webhook config with test target URLs for local kinds
  const saveResponse = await page.request.put(`/api/projects/${project.id}/webhooks`, {
    data: {
      slack: {
        endpoints: [{
          id: 'slack-e2e',
          url: `${env.appOrigin}/api/test/webhook-target/slack`,
          enabled: true, delivery: 'immediate', format: 'full',
        }],
      },
      discord: {
        endpoints: [{
          id: 'discord-e2e',
          url: `${env.appOrigin}/api/test/webhook-target/discord`,
          enabled: true, delivery: 'immediate', format: 'full',
        }],
      },
      generic: {
        endpoints: [{
          id: 'generic-e2e',
          url: `${env.appOrigin}/api/test/webhook-target/generic`,
          enabled: true, delivery: 'immediate', format: 'full',
        }],
      },
    },
  })
  expect(saveResponse.ok()).toBe(true)

  // Verify config was persisted
  const getResponse = await page.request.get(`/api/projects/${project.id}/webhooks`)
  expect(getResponse.ok()).toBe(true)
  const savedConfig = await getResponse.json()
  expect(savedConfig.slack?.endpoints).toHaveLength(1)
  expect(savedConfig.discord?.endpoints).toHaveLength(1)
  expect(savedConfig.generic?.endpoints).toHaveLength(1)

  // Send test webhook for each local kind via API
  for (const kind of LOCAL_KINDS) {
    const endpoint = savedConfig[kind]?.endpoints?.[0]
    expect(endpoint).toBeTruthy()

    const testResponse = await page.request.post(`/api/projects/${project.id}/webhooks`, {
      data: { type: kind, endpoint },
    })
    expect(testResponse.ok()).toBe(true)
  }

  // Verify all 3 deliveries succeeded
  const deliveries = await waitForDeliveries(
    page,
    project.id,
    (items) => {
      const successByKind = new Map<string, boolean>()
      for (const item of items) {
        if (item.status === 'success') successByKind.set(item.kind, true)
      }
      return LOCAL_KINDS.every((kind) => successByKind.get(kind))
    },
  )

  expect(deliveries.filter((d) => d.status === 'success').length).toBeGreaterThanOrEqual(3)

  // Resend the first slack delivery via API
  const slackDelivery = deliveries.find((d) => d.kind === 'slack' && d.status === 'success')
  expect(slackDelivery).toBeTruthy()

  const resendResponse = await page.request.post(`/api/projects/${project.id}/webhooks`, {
    data: { action: 'resend', deliveryId: slackDelivery!.id },
  })
  expect(resendResponse.ok()).toBe(true)

  // Verify we now have at least 2 successful slack deliveries
  await waitForDeliveries(
    page,
    project.id,
    (items) => items.filter((d) => d.kind === 'slack' && d.status === 'success').length >= 2,
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

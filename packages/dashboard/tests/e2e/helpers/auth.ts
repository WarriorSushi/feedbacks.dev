import type { Page } from '@playwright/test'
import { getE2EEnvironment } from './seed'

export async function signInWithTestSession(page: Page) {
  const env = getE2EEnvironment()
  if (!env.ready) {
    throw new Error(env.skipReason)
  }

  await page.goto(env.baseURL, { waitUntil: 'domcontentloaded' })

  const response = await page.evaluate(
    async ({ email, password, secret }) => {
      const result = await fetch('/api/test/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, secret }),
      })

      return {
        ok: result.ok,
        status: result.status,
        payload: await result.json().catch(() => ({})),
      }
    },
    {
      email: env.testEmail,
      password: env.testPassword,
      secret: env.authBypassSecret,
    },
  )

  if (!response.ok) {
    throw new Error(`Unable to create test session (${response.status}): ${JSON.stringify(response.payload)}`)
  }

  await page.goto(env.baseURL, { waitUntil: 'domcontentloaded' })
}

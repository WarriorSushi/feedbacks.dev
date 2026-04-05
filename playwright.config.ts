import { defineConfig, devices } from '@playwright/test'
import './packages/dashboard/tests/e2e/helpers/load-env'
import { getE2EEnvironment, isLocalBaseURL } from './packages/dashboard/tests/e2e/helpers/seed'

const LOCAL_PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3000'

process.env.PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || LOCAL_PLAYWRIGHT_BASE_URL
process.env.APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL

if (!isLocalBaseURL(process.env.NEXT_PUBLIC_APP_ORIGIN || '')) {
  process.env.NEXT_PUBLIC_APP_ORIGIN = process.env.PLAYWRIGHT_BASE_URL
}

const env = getE2EEnvironment()
const shouldStartWebServer = env.ready && isLocalBaseURL(env.baseURL)

export default defineConfig({
  testDir: './packages/dashboard/tests/e2e',
  testMatch: /.*\.spec\.ts/,
  outputDir: './output/playwright',
  globalSetup: './packages/dashboard/tests/e2e/global.setup.ts',
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // The suite seeds shared backend state and pays first-compile costs in Next dev,
  // so serial workers keep local runs aligned with CI and reduce false timeouts.
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['line']],
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: shouldStartWebServer
    ? {
        command: 'pnpm --filter @feedbacks/dashboard dev',
        url: env.baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
})

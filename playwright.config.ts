import { defineConfig, devices } from '@playwright/test'
import { getE2EEnvironment, isLocalBaseURL } from './packages/dashboard/tests/e2e/helpers/seed'

const env = getE2EEnvironment()
const shouldStartWebServer = env.ready && isLocalBaseURL(env.baseURL)

export default defineConfig({
  testDir: './packages/dashboard/tests/e2e',
  testMatch: /.*\.spec\.ts/,
  outputDir: './output/playwright',
  globalSetup: './packages/dashboard/tests/e2e/global.setup.ts',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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

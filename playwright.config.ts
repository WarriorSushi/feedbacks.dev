import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  // Optionally auto-start the dashboard dev server
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: 'npm run dashboard:dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});


import { test, expect } from '@playwright/test';

test.describe('Widget Demo', () => {
  const apiKey = process.env.FEEDBACKS_TEST_API_KEY || 'feedbacks_dev_api_key_demo123';

  test('renders inline, trigger, and floating instances', async ({ page }) => {
    await page.goto(`/widget-demo?apiKey=${apiKey}`);

    // Inline container should render a widget soon after load
    await expect(page.locator('#feedback-widget .feedbacks-widget')).toBeVisible({ timeout: 10_000 });

    // Trigger button opens modal
    await page.getByRole('button', { name: 'Give Feedback' }).click();
    await expect(page.locator('.feedbacks-overlay')).toBeVisible({ timeout: 10_000 });
    // Close modal by pressing Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('.feedbacks-overlay')).toBeHidden();

    // Floating button exists
    await expect(page.locator('.feedbacks-button')).toBeVisible();
  });

  test('submits feedback successfully (inline)', async ({ page }) => {
    await page.goto(`/widget-demo?apiKey=${apiKey}`);
    const inlineWidget = page.locator('#feedback-widget .feedbacks-widget');
    await inlineWidget.waitFor({ state: 'visible', timeout: 10_000 });

    await page.fill('#feedbacks-message-inline', 'Playwright test feedback');
    await page.click('.feedbacks-btn-primary');

    // Success state should show up either as inline success or modal success
    await expect(page.locator('.feedbacks-success')).toBeVisible({ timeout: 10_000 });
  });
});


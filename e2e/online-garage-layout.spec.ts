import { expect, test } from '@playwright/test';

test('online garage action hierarchy stays inside the stage', async ({ page }) => {
  await page.goto('.');
  await page.evaluate(() => document.getElementById('st-splash')?.remove());
  await expect(page.locator('.lobby-garage')).toHaveCount(2);

  await page.getByRole('tab', { name: 'Play Online' }).click();
  await expect(page.locator('.lobby-garage')).toHaveCount(1);

  const fit = await page.locator('.lobby-card').evaluate((card) => ({
    clientHeight: card.clientHeight,
    scrollHeight: card.scrollHeight,
  }));
  expect(fit.scrollHeight).toBeLessThanOrEqual(fit.clientHeight + 1);
});

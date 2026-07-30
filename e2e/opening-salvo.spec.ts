import { test, expect, type Page } from '@playwright/test';
import { gotoRunningGame } from './support';

const SOLUTION_RGB = { r: 155, g: 232, b: 255 };

async function solutionPixels(page: Page) {
  return page.locator('#game').evaluate((canvas: HTMLCanvasElement, rgb) => {
    const ctx = canvas.getContext('2d')!;
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;
    for (let offset = 0; offset < image.data.length; offset += 4) {
      if (
        image.data[offset] === rgb.r
        && image.data[offset + 1] === rgb.g
        && image.data[offset + 2] === rgb.b
        && image.data[offset + 3] > 0
      ) {
        const pixel = offset / 4;
        const x = pixel % canvas.width;
        const y = Math.floor(pixel / canvas.width);
        count++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    return { count, minX, minY, maxX, maxY };
  }, SOLUTION_RGB);
}

test.describe('opening salvo assist', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRunningGame(page);
  });

  test('teaches the opening rotation, reacts to aim, then yields to normal play', async ({
    page,
  }) => {
    await expect.poll(async () => (await solutionPixels(page)).count)
      .toBeGreaterThan(20);
    const opening = await solutionPixels(page);

    await page.keyboard.press('ArrowUp');
    await expect.poll(async () => solutionPixels(page))
      .not.toEqual(opening);
    const adjusted = await solutionPixels(page);
    expect(adjusted.count).toBeGreaterThan(20);

    const action = page.locator('.st-hud__primary-action');
    for (let shot = 0; shot < 2; shot++) {
      await expect(action).toBeEnabled();
      await action.click();
      await expect(action).toBeDisabled();
      await expect(action).toBeEnabled({ timeout: 15_000 });
    }

    await expect.poll(async () => (await solutionPixels(page)).count)
      .toBe(0);
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));
    expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.height).toBeLessThanOrEqual(geometry.viewportHeight);
  });
});

import { test, expect, type Page } from '@playwright/test';
import { gotoRunningGame } from './support';

async function storeCanvasFrame(page: Page): Promise<void> {
  await page.locator('#game').evaluate((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    (globalThis as typeof globalThis & { __aimGuideFrame?: Uint8ClampedArray })
      .__aimGuideFrame = frame.data.slice();
  });
}

async function changedCanvasPixels(page: Page): Promise<number> {
  return page.locator('#game').evaluate((canvas: HTMLCanvasElement) => {
    const previous = (
      globalThis as typeof globalThis & { __aimGuideFrame?: Uint8ClampedArray }
    ).__aimGuideFrame;
    if (!previous) return 0;

    const current = canvas.getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height)
      .data;
    let changed = 0;
    for (let offset = 0; offset < current.length; offset += 4) {
      if (
        current[offset] !== previous[offset]
        || current[offset + 1] !== previous[offset + 1]
        || current[offset + 2] !== previous[offset + 2]
        || current[offset + 3] !== previous[offset + 3]
      ) {
        changed++;
      }
    }
    return changed;
  });
}

async function expectGuideToggleChangesCanvas(page: Page): Promise<void> {
  await storeCanvasFrame(page);
  await page.keyboard.press('g');
  await expect.poll(() => changedCanvasPixels(page)).toBeGreaterThan(20);
}

test.describe('bounded aim guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('singedterra:aimguide', '1');
    });
    await gotoRunningGame(page);
    // Let the bounded turn-opening wind flourish expire so guide-toggle deltas
    // are isolated from cosmetic animation.
    await page.waitForTimeout(1_000);
  });

  test('reacts to aim, never disappears after the opening rotation, and stays fitted', async ({
    page,
  }) => {
    // G only controls the local launch hint. A visible delta proves the guide is
    // present without relying on an exact full-path color or impact marker.
    await expectGuideToggleChangesCanvas(page);
    await page.keyboard.press('g'); // restore enabled

    await storeCanvasFrame(page);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => changedCanvasPixels(page)).toBeGreaterThan(20);

    const action = page.locator('.st-hud__primary-action');
    for (let shot = 0; shot < 2; shot++) {
      await expect(action).toBeEnabled();
      await action.click();
      await expect(action).toBeDisabled();
      await expect(action).toBeEnabled({ timeout: 15_000 });
      if (shot === 0) {
        await expect(page.getByRole('img', { name: 'Elevation gauge' }))
          .toContainText('45° ◀');
      }
    }

    // Turn 2 is beyond the two-seat opening rotation. The same bounded hint must
    // still exist—there is no privileged collision-accurate opening solution.
    await expectGuideToggleChangesCanvas(page);

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

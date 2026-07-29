import { test, expect } from '@playwright/test';
import { gotoRunningGame } from './support';

test.describe('atmospheric battlefield frame', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRunningGame(page);
  });

  test('fills viewport gutters without reintroducing scrolling or clipping', async ({ page }) => {
    const result = await page.evaluate(() => {
      const bodyBefore = getComputedStyle(document.body, '::before');
      const app = document.querySelector<HTMLElement>('#app')!;
      const appBox = app.getBoundingClientRect();
      return {
        ambientContent: bodyBefore.content,
        ambientBackground: bodyBefore.backgroundImage,
        ambientOpacity: Number.parseFloat(bodyBefore.opacity),
        app: {
          left: appBox.left,
          top: appBox.top,
          right: appBox.right,
          bottom: appBox.bottom,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        scroll: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        },
      };
    });

    expect(result.ambientContent).toBe('""');
    expect(result.ambientBackground).toContain('radial-gradient');
    expect(result.ambientBackground).toContain('linear-gradient');
    expect(result.ambientOpacity).toBeGreaterThan(0);
    expect(result.app.left).toBeGreaterThanOrEqual(-1);
    expect(result.app.top).toBeGreaterThanOrEqual(-1);
    expect(result.app.right).toBeLessThanOrEqual(result.viewport.width + 1);
    expect(result.app.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
    expect(result.scroll.width).toBeLessThanOrEqual(result.viewport.width);
    expect(result.scroll.height).toBeLessThanOrEqual(result.viewport.height);
  });
});

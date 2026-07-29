import { test, expect } from '@playwright/test';
import {
  gotoRunningGame,
  isCompact,
  findHudLayoutViolations,
  assertInstrumentsHeight,
} from './support';

/**
 * HUD rendering-guardrail suite. Runs across the viewport matrix (desktop-fine,
 * pixel-touch, small-window) defined in playwright.config.ts. Every assertion
 * reads COMPUTED GEOMETRY from real Chromium — not DOM presence — because the bug
 * these guard against (the instrument cluster flex-crushed to ~10.6px) had the
 * right DOM but the wrong layout.
 */
test.describe('HUD layout guardrails', () => {
  test.beforeEach(async ({ page }) => {
    await gotoRunningGame(page);
  });

  test('instrument cluster is not flex-crushed (the exact regression)', async ({ page }) => {
    const compact = await isCompact(page);
    await assertInstrumentsHeight(page, compact);
  });

  test('no direct #hud child is crushed or content-clipped (generalized invariant)', async ({
    page,
  }) => {
    const violations = await findHudLayoutViolations(page);
    expect(
      violations,
      `#hud children must not be crushed/clipped, got: ${JSON.stringify(violations, null, 2)}`,
    ).toEqual([]);
  });

  test('the analog console is visible, boxed, and inside #hud at every scale', async ({ page }) => {
    const dials = page.locator('.st-hud__gauge-row');
    const nums = page.locator('.st-hud__gauge-nums');

    await expect(dials).toBeVisible();
    await expect(nums).toHaveCount(0);

    const gaugeBox = await dials.boundingBox();
    expect(gaugeBox, 'the visible gauge representation should have a box').not.toBeNull();
    expect(gaugeBox!.width).toBeGreaterThan(0);
    expect(gaugeBox!.height).toBeGreaterThan(0);

    // The gauges must lie within the #hud panel — not overflowing/clipped out of it.
    const hudBox = await page.locator('#hud').boundingBox();
    expect(hudBox).not.toBeNull();
    expect(gaugeBox!.x).toBeGreaterThanOrEqual(hudBox!.x - 1);
    expect(gaugeBox!.x + gaugeBox!.width).toBeLessThanOrEqual(hudBox!.x + hudBox!.width + 1);
    expect(gaugeBox!.y).toBeGreaterThanOrEqual(hudBox!.y - 1);
    expect(gaugeBox!.y + gaugeBox!.height).toBeLessThanOrEqual(hudBox!.y + hudBox!.height + 1);

    const elevationBox = await page.locator('.st-hud__gauge-cell--elevation').boundingBox();
    const powerBox = await page.locator('.st-hud__gauge-cell--power').boundingBox();
    const windBox = await page.locator('.st-hud__gauge-cell--wind').boundingBox();
    expect(elevationBox).not.toBeNull();
    expect(powerBox).not.toBeNull();
    expect(windBox).not.toBeNull();
    expect(Math.abs(elevationBox!.y - powerBox!.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(elevationBox!.width - powerBox!.width)).toBeLessThanOrEqual(1);
    expect(windBox!.y).toBeGreaterThan(elevationBox!.y + elevationBox!.height);
    expect(windBox!.width).toBeGreaterThan(elevationBox!.width * 1.8);
  });

  test('active player + weapon row has a non-zero visible box', async ({ page }) => {
    const activeRow = page.locator('.st-hud__active-row');
    await expect(activeRow).toBeVisible();
    const box = await activeRow.boundingBox();
    expect(box, 'active/weapon row should have a rendered box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(4);
  });

  test('compact touch starts fitted with arsenal collapsed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'pixel-touch');
    const strip = page.locator('.st-hud__strip');
    await expect(strip).toHaveClass(/st-hud__strip--collapsed/);
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.st-hud__strip-grid')).toBeHidden();
    await expect(page.locator('.st-hud__strip-scroll-hint')).toBeHidden();
    const geometry = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  });

  test('compact touch expansion exposes arsenal and scroll hint', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'pixel-touch');
    await page.locator('.st-hud__strip-toggle').click();
    await expect(page.locator('.st-hud__strip-grid')).toBeVisible();
    await expect(page.locator('.st-hud__strip-scroll-hint')).toBeVisible();
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'true');

    await page.locator('.st-hud__strip-toggle').click();
    await expect(page.locator('.st-hud__strip-grid')).toBeHidden();
    await expect(page.locator('.st-hud__strip-scroll-hint')).toBeHidden();
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('HUD arsenal responsive defaults', () => {
  test('desktop-fine starts with an expanded arsenal', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-fine');
    await gotoRunningGame(page);
    await expect(page.locator('.st-hud__strip-grid')).toBeVisible();
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('small fine-pointer windows start collapsed and keep the HUD fitted', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'small-window');
    await gotoRunningGame(page);
    await expect(page.locator('.st-hud__strip-grid')).toBeHidden();
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'false');
    const geometry = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  });

  test('saved expanded preference wins on compact touch', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'pixel-touch');
    await page.addInitScript(() => localStorage.setItem('st_arsenal_collapsed', '0'));
    await gotoRunningGame(page);
    await expect(page.locator('.st-hud__strip')).not.toHaveClass(/st-hud__strip--collapsed/);
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('implicit default follows compact-touch changes until manually toggled', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'pixel-touch');
    await page.setViewportSize({ width: 1200, height: 720 });
    await gotoRunningGame(page);
    const strip = page.locator('.st-hud__strip');
    const toggle = page.locator('.st-hud__strip-toggle');
    await expect(strip).not.toHaveClass(/st-hud__strip--collapsed/);

    await page.setViewportSize({ width: 915, height: 412 });
    await expect(strip).toHaveClass(/st-hud__strip--collapsed/);
    await toggle.click();
    await expect(strip).not.toHaveClass(/st-hud__strip--collapsed/);

    await page.setViewportSize({ width: 1200, height: 720 });
    await page.setViewportSize({ width: 915, height: 412 });
    await expect(strip).not.toHaveClass(/st-hud__strip--collapsed/);
  });
});

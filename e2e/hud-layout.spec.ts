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

  test('active player + weapon row is explicit, visible, and fitted', async ({ page }) => {
    const activeRow = page.locator('.st-hud__active-row');
    await expect(activeRow).toBeVisible();
    await expect(activeRow.locator('.st-hud__turn-owner')).toHaveText('P1');
    await expect(activeRow.locator('.st-hud__weapon-value')).toHaveText('Baby Missile');
    await expect(activeRow.locator('.st-hud__turn-status')).toHaveAttribute(
      'aria-label',
      "P1's turn. Weapon Baby Missile. 100 fuel remaining.",
    );
    const box = await activeRow.boundingBox();
    expect(box, 'active/weapon row should have a rendered box').not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(4);
    const geometry = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  });

  test('mobility rocker stays fitted and spends authoritative fuel without ending the turn', async ({
    page,
  }) => {
    const activeRow = page.locator('.st-hud__active-row');
    const mobility = activeRow.locator('.st-hud__mobility');
    const left = mobility.locator('[data-move="-8"]');
    const right = mobility.locator('[data-move="8"]');
    const fuel = mobility.locator('.st-hud__fuel-value');

    await expect(mobility).toBeVisible();
    await expect(mobility).toHaveAttribute('role', 'group');
    await expect(mobility).toHaveAttribute('aria-label', 'Tank movement');
    await expect(left).toBeEnabled();
    await expect(right).toBeEnabled();
    await expect(fuel).toHaveText('100');

    const rowBox = await activeRow.boundingBox();
    const mobilityBox = await mobility.boundingBox();
    expect(rowBox).not.toBeNull();
    expect(mobilityBox).not.toBeNull();
    expect(mobilityBox!.x).toBeGreaterThanOrEqual(rowBox!.x - 1);
    expect(mobilityBox!.x + mobilityBox!.width)
      .toBeLessThanOrEqual(rowBox!.x + rowBox!.width + 1);

    await right.click();
    let remaining = Number(await fuel.textContent());
    if (remaining === 100) {
      await left.click();
      remaining = Number(await fuel.textContent());
    }
    expect(remaining).toBeGreaterThanOrEqual(92);
    expect(remaining).toBeLessThan(100);
    await expect(activeRow.locator('.st-hud__turn-owner')).toHaveText('P1');
    await expect(activeRow.locator('.st-hud__turn-status')).toHaveAttribute(
      'aria-label',
      `P1's turn. Weapon Baby Missile. ${remaining} fuel remaining.`,
    );

    const geometry = await page.evaluate(() => ({
      hudClient: document.querySelector<HTMLElement>('#hud')!.clientHeight,
      hudScroll: document.querySelector<HTMLElement>('#hud')!.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
      pageHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));
    expect(geometry.hudScroll).toBeLessThanOrEqual(geometry.hudClient + 1);
    expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.pageHeight).toBeLessThanOrEqual(geometry.viewportHeight);
  });

  test('one primary action stays visible, in-bounds, and drives the live fire path', async ({
    page,
  }, testInfo) => {
    const action = page.locator('.st-hud__primary-action');
    await expect(action).toHaveCount(1);
    await expect(action).toBeVisible();
    await expect(action).toBeEnabled();
    await expect(action).toContainText('Fire');
    await expect(page.locator('.st-hud__touch-fire')).toHaveCount(0);

    const hudBox = await page.locator('#hud').boundingBox();
    const actionBox = await action.boundingBox();
    expect(hudBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(actionBox!.x).toBeGreaterThanOrEqual(hudBox!.x - 1);
    expect(actionBox!.x + actionBox!.width)
      .toBeLessThanOrEqual(hudBox!.x + hudBox!.width + 1);
    expect(actionBox!.y).toBeGreaterThanOrEqual(hudBox!.y - 1);
    expect(actionBox!.y + actionBox!.height)
      .toBeLessThanOrEqual(hudBox!.y + hudBox!.height + 1);
    if (testInfo.project.name === 'pixel-touch') {
      expect(actionBox!.height).toBeGreaterThanOrEqual(44);
    }

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    let reachedAction = false;
    for (let index = 0; index < 20 && !reachedAction; index++) {
      await page.keyboard.press('Tab');
      reachedAction = await action.evaluate((element) => document.activeElement === element);
    }
    expect(reachedAction, 'Tab should reach the primary action').toBe(true);
    await page.keyboard.press('Enter');
    await expect(action).toBeDisabled();
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

  test('arsenal opens as a fitted drawer without changing rail height', async ({ page }) => {
    const before = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    await page.locator('.st-hud__strip-toggle').click();
    await expect(page.locator('.st-hud__strip-grid')).toBeVisible();
    await expect(page.locator('.st-hud__strip')).toHaveClass(/st-hud__strip--open/);
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'true');
    const hudBox = await page.locator('#hud').boundingBox();
    const drawerBox = await page.locator('.st-hud__strip').boundingBox();
    expect(hudBox).not.toBeNull();
    expect(drawerBox).not.toBeNull();
    expect(drawerBox!.x).toBeGreaterThanOrEqual(hudBox!.x - 1);
    expect(drawerBox!.x + drawerBox!.width)
      .toBeLessThanOrEqual(hudBox!.x + hudBox!.width + 1);
    expect(drawerBox!.y).toBeGreaterThanOrEqual(hudBox!.y - 1);
    expect(drawerBox!.y + drawerBox!.height)
      .toBeLessThanOrEqual(hudBox!.y + hudBox!.height + 1);
    for (const locator of [
      page.locator('.st-hud__strip-grid'),
      page.locator('.st-hud__strip-toggle'),
    ]) {
      const childBox = await locator.boundingBox();
      expect(childBox).not.toBeNull();
      expect(childBox!.x).toBeGreaterThanOrEqual(drawerBox!.x - 1);
      expect(childBox!.x + childBox!.width)
        .toBeLessThanOrEqual(drawerBox!.x + drawerBox!.width + 1);
      expect(childBox!.y).toBeGreaterThanOrEqual(drawerBox!.y - 1);
      expect(childBox!.y + childBox!.height)
        .toBeLessThanOrEqual(drawerBox!.y + drawerBox!.height + 1);
    }
    const open = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    expect(open.scrollHeight).toBeLessThanOrEqual(open.clientHeight + 1);
    expect(open.scrollHeight).toBe(before.scrollHeight);

    const inertSiblings = await page.locator('#hud').evaluate((hud) =>
      [...hud.children]
        .filter((child) => !child.classList.contains('st-hud__strip'))
        .every((child) => (child as HTMLElement).inert),
    );
    expect(inertSiblings).toBe(true);
    await page.locator('.st-hud__weapon-btn:visible').first().focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.st-hud__strip-grid')).toBeHidden();
    await expect(page.locator('.st-hud__strip')).not.toHaveClass(/st-hud__strip--open/);
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.st-hud__strip-toggle')).toBeFocused();
    await expect(page.locator('.st-hud__strip-toggle')).toContainText('Expand');
    const releasedSiblings = await page.locator('#hud').evaluate((hud) =>
      [...hud.children]
        .filter((child) => !child.classList.contains('st-hud__strip'))
        .every((child) => !(child as HTMLElement).inert),
    );
    expect(releasedSiblings).toBe(true);
  });
});

test.describe('HUD arsenal responsive defaults', () => {
  test('desktop-fine starts with a closed arsenal drawer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-fine');
    await gotoRunningGame(page);
    await expect(page.locator('.st-hud__strip-grid')).toBeHidden();
    await expect(page.locator('.st-hud__strip-toggle')).toHaveAttribute('aria-expanded', 'false');
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
    const geometry = await page.locator('#hud').evaluate((hud) => ({
      clientHeight: hud.clientHeight,
      scrollHeight: hud.scrollHeight,
    }));
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
  });
});

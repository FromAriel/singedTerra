import { expect, test } from '@playwright/test';
import { assertLobbyControlReachable, assertLobbyFrame, gotoLobby, isCompact } from './support';

async function expectBriefHeaderAboveSetup(page: Parameters<typeof gotoLobby>[0]): Promise<void> {
  const overlap = await page.locator('#lobby .lobby-route-brief').evaluate((brief) => {
    const heading = brief.querySelector<HTMLElement>('.lobby-route-brief__title');
    const firstSetupChild = brief.querySelector<HTMLElement>('.lobby-route-brief__setup > *');
    if (!heading || !firstSetupChild) throw new Error('Expected a route heading and setup control');
    const headingRect = heading.getBoundingClientRect();
    const setupRect = firstSetupChild.getBoundingClientRect();
    return {
      headingBottom: headingRect.bottom,
      setupTop: setupRect.top,
    };
  });

  expect(
    overlap.headingBottom,
    'compact route heading must clear its first setup control',
  ).toBeLessThanOrEqual(overlap.setupTop + 1);
}

async function commandStyle(page: Parameters<typeof gotoLobby>[0]): Promise<{
  shellRule: string;
  hotSeatRadius: string;
}> {
  return page.locator('#lobby .lobby-command-header').evaluate((header) => {
    const shell = getComputedStyle(header);
    const lobby = document.querySelector<HTMLElement>('#lobby');
    const hotSeat = lobby?.querySelector<HTMLElement>('.lobby-start');
    if (!hotSeat) throw new Error('Expected Hot Seat control is missing');
    return {
      shellRule: shell.borderBottomStyle,
      hotSeatRadius: getComputedStyle(hotSeat).borderRadius,
    };
  });
}

test.describe('Pre-game command shell', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLobby(page);
  });

  test('gives Hot Seat a tactical shell and squared command controls', async ({ page }) => {
    const shell = page.locator('#lobby .lobby-command-header');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('aria-label', 'Pre-game command preparation');
    await expect(shell).toHaveText('COMMAND PREPARATION');
    await expect(page.getByRole('heading', { name: 'COMMAND PREPARATION', exact: true })).toBeVisible();

    const style = await commandStyle(page);
    expect(style.shellRule).toBe('solid');
    expect(style.hotSeatRadius).toBe('0px');
    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-start');
  });

  test('carries the same command hierarchy into Online room entry', async ({ page }) => {
    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();

    const style = await page.locator('#lobby .lobby-online-primary').evaluate((primary) => ({
      radius: getComputedStyle(primary).borderRadius,
      surface: getComputedStyle(primary).backgroundColor,
    }));
    expect(style.radius).toBe('0px');
    expect(style.surface).not.toBe('rgb(255, 210, 63)');
    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="join-code"]');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="browse"]');
  });

  test('frames each immediate commitment as a contained deployment brief', async ({ page }) => {
    const brief = page.locator('#lobby .lobby-route-brief');
    await expect(brief).toBeVisible();
    await expect(brief.getByRole('heading', { name: 'Local battery' })).toBeVisible();
    await expect(brief.locator('.lobby-route-brief__setup')).toHaveAttribute(
      'aria-label',
      'Local battery setup',
    );
    expect(await brief.evaluate((element) => getComputedStyle(element).borderLeftStyle)).toBe('solid');
    await assertLobbyControlReachable(page, '#lobby .lobby-start');

    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await expect(brief.getByRole('heading', { name: 'Open operation' })).toBeVisible();
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');

    await page.locator('[data-online-route="join-code"]').click();
    await expect(brief.getByRole('heading', { name: 'Rally to a signal' })).toBeVisible();
    await expect(brief.locator('.lobby-route-brief__setup')).toHaveAttribute('aria-label', 'Rally setup');
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');
  });

  test('keeps each compact route heading above its first setup control', async ({ page }) => {
    test.skip(!(await isCompact(page)), 'The compact guard applies only below the fixed-stage threshold.');

    await expectBriefHeaderAboveSetup(page);

    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await expectBriefHeaderAboveSetup(page);

    await page.locator('[data-online-route="join-code"]').click();
    await expectBriefHeaderAboveSetup(page);
  });

  test('uses one deployment grid with a dominant route action at every supported size', async ({
    page,
  }, testInfo) => {
    const shell = page.locator('#lobby .lobby-deployment');
    const hotSeatPrimary = page.locator('#lobby .lobby-start');
    const initialLayout = await shell.evaluate((element) => {
      const style = getComputedStyle(element);
      const lobby = document.querySelector<HTMLElement>('#lobby')!;
      return {
        display: style.display,
        columns: style.gridTemplateColumns.split(' ').filter(Boolean),
        width: element.getBoundingClientRect().width,
        lobbyWidth: lobby.getBoundingClientRect().width,
      };
    });
    expect(initialLayout.display).toBe('grid');
    expect(initialLayout.columns).toHaveLength(
      testInfo.project.name === 'desktop-fine' ? 2 : 1,
    );
    expect(initialLayout.width / initialLayout.lobbyWidth).toBeGreaterThan(0.82);
    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-start');

    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await expect(page.locator('#lobby .lobby-deployment__mission-brief'))
      .toHaveText(/Play Online/);
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');
    await expect(hotSeatPrimary).toBeHidden();
  });

});

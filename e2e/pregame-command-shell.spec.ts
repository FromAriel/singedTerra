import { expect, test } from '@playwright/test';
import { assertLobbyControlReachable, assertLobbyFrame, gotoLobby } from './support';

async function commandStyle(page: Parameters<typeof gotoLobby>[0]): Promise<{
  shellRule: string;
  hotSeatRadius: string;
  accountRadius: string;
}> {
  return page.locator('#lobby .lobby-command-header').evaluate((header) => {
    const shell = getComputedStyle(header);
    const hotSeat = document.querySelector<HTMLElement>('#lobby .lobby-start')!;
    const account = document.querySelector<HTMLElement>('#lobby .account-panel button')!;
    return {
      shellRule: shell.borderBottomStyle,
      hotSeatRadius: getComputedStyle(hotSeat).borderRadius,
      accountRadius: getComputedStyle(account).borderRadius,
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
    expect(style.accountRadius).toBe('0px');
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

});

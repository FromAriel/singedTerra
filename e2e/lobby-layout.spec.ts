import { expect, test, type Page } from '@playwright/test';
import {
  assertLobbyControlReachable,
  assertLobbyFrame,
  gotoLobby,
} from './support';

async function assertOperationsBoardFlow(page: Page, selector: string): Promise<void> {
  const geometry = await page.locator(selector).evaluate((board) => {
    const root = board.getBoundingClientRect();
    const header = board.querySelector<HTMLElement>(':scope > .lobby-operations-board__header');
    const sections = Array.from(board.querySelectorAll<HTMLElement>(
      ':scope > .lobby-operations-board__crew, :scope > .lobby-operations-board__section, :scope > .lobby-operations-board__mission, :scope > .lobby-operations-board__roster, :scope > .lobby-operations-board__actions',
    ));
    const primary = board.querySelector<HTMLElement>('.lobby-btn.primary');
    if (!header || sections.length === 0 || !primary) {
      throw new Error('Expected a board header, operational sections, and primary action');
    }
    const serialize = (rect: DOMRect) => ({
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    });
    return {
      root: serialize(root),
      header: serialize(header.getBoundingClientRect()),
      sections: sections.map((section) => serialize(section.getBoundingClientRect())),
      primary: serialize(primary.getBoundingClientRect()),
    };
  });

  expect(geometry.header.height, 'operations-board heading must render').toBeGreaterThan(4);
  expect(geometry.header.bottom, 'heading must clear the first operational section')
    .toBeLessThanOrEqual(geometry.sections[0]!.top + 1);
  for (let index = 0; index < geometry.sections.length - 1; index += 1) {
    expect(
      geometry.sections[index]!.bottom,
      'each operational section must clear the section that follows it',
    ).toBeLessThanOrEqual(geometry.sections[index + 1]!.top + 1);
  }
  for (const rect of [...geometry.sections, geometry.primary]) {
    expect(rect.left, 'board content must stay within the board left edge').toBeGreaterThanOrEqual(geometry.root.left - 1);
    expect(rect.right, 'board content must stay within the board right edge').toBeLessThanOrEqual(geometry.root.right + 1);
  }
  expect(geometry.primary.width, 'primary action must retain a visible target').toBeGreaterThan(4);
  expect(geometry.primary.height, 'primary action must retain a visible target').toBeGreaterThan(4);
}

async function fulfillFunction(
  page: Page,
  name: string,
  body: unknown,
): Promise<{ count: () => number; urls: () => string[] }> {
  const capturedUrls: string[] = [];
  await page.route(`**/functions/v1/${name}`, async (route) => {
    capturedUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  return {
    count: () => capturedUrls.length,
    urls: () => [...capturedUrls],
  };
}

async function assertSameOriginFunctionCall(
  page: Page,
  calls: { count: () => number; urls: () => string[] },
  name: string,
): Promise<void> {
  expect(calls.count()).toBe(1);
  const requestUrl = new URL(calls.urls()[0]!);
  expect(requestUrl.origin).toBe(new URL(page.url()).origin);
  expect(requestUrl.pathname).toBe(`/functions/v1/${name}`);
}

test.describe('Lobby layout guardrails', () => {
  test.beforeEach(async ({ page }) => {
    await gotoLobby(page);
  });

  test('Hot Seat setup stays framed and its primary action is reachable', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Hot Seat', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.lobby-row')).toHaveCount(2);
    await expect(page.locator('.lobby-controls')).toContainText('Aim');

    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-start');
  });

  test('play mode tabs identify their selected setup and support predictable keyboard switching', async ({ page }) => {
    const tabs = page.locator('#lobby [role="tablist"]');
    const hotSeat = page.getByRole('tab', { name: 'Hot Seat', exact: true });
    const online = page.getByRole('tab', { name: 'Play Online', exact: true });
    const panel = page.locator('#lobby [role="tabpanel"]');

    await expect(tabs).toHaveAttribute('aria-label', 'Choose play mode');
    await expect(hotSeat).toHaveAttribute('aria-selected', 'true');
    await expect(online).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('.lobby-mode-context')).toContainText(
      'Set your crew, then start a shared-screen match.',
    );
    await expect(panel).toHaveAttribute('aria-labelledby', await hotSeat.getAttribute('id'));
    await expect(hotSeat).toHaveAttribute('aria-controls', await panel.getAttribute('id'));
    await expect(online).toHaveAttribute('aria-controls', await panel.getAttribute('id'));

    await hotSeat.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(online).toHaveAttribute('aria-selected', 'true');
    await expect(online).toBeFocused();
    await expect(page.locator('.lobby-mode-context')).toContainText(
      'Create a room, join by code, or browse public games.',
    );
    await expect(page.getByRole('heading', { name: 'Open operation', exact: true })).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(hotSeat).toHaveAttribute('aria-selected', 'true');
    await expect(hotSeat).toBeFocused();
    await expect(page.locator('.lobby-mode-context')).toContainText(
      'Set your crew, then start a shared-screen match.',
    );
    await expect(page.locator('.lobby-row')).toHaveCount(2);

    await page.keyboard.press('End');
    await expect(online).toHaveAttribute('aria-selected', 'true');
    await expect(online).toBeFocused();
    await expect(page.locator('.lobby-mode-context')).toContainText(
      'Create a room, join by code, or browse public games.',
    );

    await page.keyboard.press('Home');
    await expect(hotSeat).toHaveAttribute('aria-selected', 'true');
    await expect(hotSeat).toBeFocused();
    await expect(page.locator('.lobby-mode-context')).toContainText(
      'Set your crew, then start a shared-screen match.',
    );

    await page.keyboard.press('ArrowRight');
    await expect(online).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(hotSeat).toBeFocused();
  });

  test('Online Create stays framed and its primary action is reachable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Open operation', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Room', exact: true })).toBeVisible();
    const alternatives = page.getByRole('navigation', { name: 'Other ways to play online', exact: true });
    await expect(alternatives).toBeVisible();
    await expect(alternatives.getByRole('button', { name: 'Join with a code', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browse public rooms', exact: true })).toBeVisible();

    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="join-code"]');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="browse"]');
  });

  test('Join by Code stays framed and its primary action is reachable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await page.getByRole('button', { name: 'Join with a code', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Rally to a signal', exact: true })).toBeVisible();
    await expect(page.locator('.lobby-code-input')).toHaveAttribute('maxlength', '4');
    await expect(page.getByRole('button', { name: 'Join Room', exact: true })).toBeVisible();
    const alternatives = page.getByRole('navigation', { name: 'Other ways to play online', exact: true });
    await expect(alternatives.getByRole('button', { name: 'Create a room', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browse public rooms', exact: true })).toBeVisible();

    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .lobby-online-primary');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="create"]');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="browse"]');
  });

  test('Browse public rooms renders a reachable network fixture without leaving the frame', async ({ page }) => {
    const listRoomsCalls = await fulfillFunction(page, 'list_rooms', {
      rooms: [{
        roomId: 'room-browser-oracle',
        code: 'BROW',
        hostName: 'Atlas',
        playerCount: 1,
        maxPlayers: 4,
        rounds: 3,
        armsLevel: 2,
        botCount: 1,
        interestRate: 0.2,
        suddenDeathTurn: 15,
      }],
    });

    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await page.getByRole('button', { name: 'Browse public rooms', exact: true }).click();

    const board = page.locator('#lobby .lobby-operations-board--browse');
    await expect(board.getByRole('heading', { name: 'Open operations', exact: true })).toBeVisible();
    await expect(board.locator('.lobby-operations-board__section')).toHaveAttribute(
      'aria-label',
      'Open operations',
    );
    const room = page.locator('.online-player-row').filter({ hasText: 'Atlas' });
    await expect(room).toContainText('Best of 3');
    await expect(room).toContainText('Arms Lv 2');
    await expect(room).toContainText('1 CPU');
    await expect(room).toContainText('Interest +20%');
    await expect(room).toContainText('Sudden death T15');
    expect(await board.evaluate((element) => getComputedStyle(element).borderLeftStyle)).toBe('solid');
    const joinRoom = room.getByRole('button', { name: 'Join (1/4)', exact: true });
    await expect(joinRoom).toBeEnabled();
    await expect(joinRoom).toHaveClass(/primary/);
    const alternatives = page.getByRole('navigation', { name: 'Other ways to play online', exact: true });
    await expect(alternatives.getByRole('button', { name: 'Create a room', exact: true })).toBeVisible();
    await expect(alternatives.getByRole('button', { name: 'Join with a code', exact: true })).toBeVisible();
    await assertSameOriginFunctionCall(page, listRoomsCalls, 'list_rooms');

    await assertOperationsBoardFlow(page, '#lobby .lobby-operations-board--browse');
    await assertLobbyFrame(page);
    await assertLobbyControlReachable(page, '#lobby .online-player-row .lobby-btn');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="create"]');
    await assertLobbyControlReachable(page, '#lobby [data-online-route="join-code"]');
  });

  test('Create Room renders a reachable waiting-room fixture without leaving the frame', async ({ page }) => {
    const createRoomCalls = await fulfillFunction(page, 'create_room', {
      roomId: 'room-wait-oracle',
      code: 'WAIT',
      playerId: 'player-host',
      token: ['fixture', 'seat', 'value'].join('-'),
      options: {
        maxPlayers: 4,
        maxWind: 10,
        gravity: 0.15,
        walls: 'open',
        rounds: 3,
        armsLevel: 2,
      },
      players: [
        { id: 'player-host', name: 'Oracle Host', color: '#e84d4d', ready: false },
        { id: 'cpu-1', name: 'CPU 1', color: '#4d8ce8', ready: true, ai: 'medium' },
      ],
    });

    await page.getByRole('tab', { name: 'Play Online', exact: true }).click();
    await page.locator('#lobby .lobby-name').fill('Oracle Host');
    await page.getByRole('button', { name: 'Create Room', exact: true }).click();

    const board = page.locator('#lobby .lobby-operations-board--waiting');
    await expect(board.getByRole('heading', { name: 'Staging operation', exact: true })).toBeVisible();
    await expect(board.locator('.lobby-operations-board__mission')).toHaveAttribute(
      'aria-label',
      'Room access',
    );
    await expect(board.locator('.lobby-operations-board__roster')).toHaveAttribute(
      'aria-label',
      'Operation roster',
    );
    expect(await board.evaluate((element) => getComputedStyle(element).borderLeftStyle)).toBe('solid');
    await expect(page.getByText('Share this code:', { exact: true })).toBeVisible();
    await expect(page.locator('.online-code-char')).toHaveText(['W', 'A', 'I', 'T']);
    const roster = page.locator('.online-player-list');
    await expect(roster.getByText('Oracle Host', { exact: true })).toBeVisible();
    await expect(roster.getByText('CPU 1', { exact: true })).toBeVisible();
    await expect(page.getByText('0/1 human ready', { exact: false })).toContainText('1 CPU');
    await expect(page.getByText('0/1 human ready', { exact: false })).toContainText('waiting for players to join');
    const copyInvite = page.getByRole('button', { name: 'Copy invite link', exact: true });
    const readyUp = page.getByRole('button', { name: 'Ready Up', exact: true });
    await expect(copyInvite).toBeVisible();
    await expect(copyInvite).toHaveClass(/secondary/);
    await expect(readyUp).toBeEnabled();
    await expect(readyUp).toHaveClass(/primary/);
    await expect(page.getByRole('button', { name: 'Leave', exact: true })).toBeVisible();
    await assertSameOriginFunctionCall(page, createRoomCalls, 'create_room');

    await assertOperationsBoardFlow(page, '#lobby .lobby-operations-board--waiting');
    await assertLobbyFrame(page);
    await assertLobbyControlReachable(
      page,
      '#lobby .lobby-btn-row:last-child .lobby-btn:not(.secondary)',
    );
  });
});

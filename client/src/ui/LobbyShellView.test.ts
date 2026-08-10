import { describe, expect, it, vi } from 'vitest';
import {
  buildLobbyOnlineView,
  buildLobbyShellView,
  type LobbyShellViewOptions,
} from './LobbyShellView';

function section(name: string): HTMLElement {
  const element = document.createElement('section');
  element.dataset['section'] = name;
  return element;
}

function options(overrides: Partial<LobbyShellViewOptions> = {}): LobbyShellViewOptions {
  return {
    activeTab: 'hotseat',
    rejoinAvailable: true,
    account: section('account'),
    vehiclePreview: section('vehicle-preview'),
    content: section('content'),
    controls: section('controls'),
    onTabChange: vi.fn(),
    onQuickDuel: vi.fn(),
    onRejoin: vi.fn(),
    ...overrides,
  };
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const match = [...root.querySelectorAll('button')]
    .find((candidate) => candidate.textContent === text);
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Missing ${text} button`);
  return match;
}

describe('buildLobbyShellView', () => {
  it('organizes every route beneath one named deployment command hierarchy', () => {
    const root = buildLobbyShellView(options());

    const deployment = root.querySelector<HTMLElement>('.lobby-deployment');
    const masthead = root.querySelector<HTMLElement>('.lobby-deployment__masthead');
    const rail = root.querySelector<HTMLElement>('.lobby-deployment__mode-rail');
    const brief = root.querySelector<HTMLElement>('.lobby-deployment__mission-brief');
    const quickDuel = root.querySelector<HTMLElement>('.lobby-quick-duel');
    const quickDuelAction = button(root, 'Quick Duel vs CPU');
    const tabs = root.querySelector<HTMLElement>('.lobby-tabs');
    const panel = root.querySelector<HTMLElement>('[role="tabpanel"]');
    const preview = root.querySelector<HTMLElement>('[data-section="vehicle-preview"]');
    const controls = root.querySelector<HTMLElement>('[data-section="controls"]');

    expect(deployment?.tagName).toBe('MAIN');
    expect(deployment?.getAttribute('aria-label')).toBe('Deployment preparation');
    expect(masthead?.querySelector('h1')?.textContent).toBe('singedTerra');
    expect(rail?.getAttribute('aria-label')).toBe('Choose deployment mode');
    expect(brief?.querySelector('h2')?.textContent).toBe('Hot Seat');
    expect(quickDuel?.querySelector('.lobby-quick-duel__action')).toBe(quickDuelAction);
    expect([...rail!.children]).toEqual([quickDuel, tabs]);
    expect([...deployment!.children]).toEqual([
      masthead,
      rail,
      brief,
      panel,
      preview,
      controls,
    ]);
  });

  it('renders the exact shell order with the conditional rejoin affordance', () => {
    const vehiclePreview = section('vehicle-preview');
    const account = section('account');
    const content = section('content');
    const controls = section('controls');
    const root = buildLobbyShellView(options({ account, vehiclePreview, content, controls }));

    expect(root.className).toBe('lobby-card');
    const title = root.querySelector('h1');
    const commandHeader = root.querySelector<HTMLElement>('.lobby-command-header');
    const rejoin = root.querySelector('.lobby-rejoin-banner');
    const deployment = root.querySelector<HTMLElement>('.lobby-deployment');
    const masthead = root.querySelector<HTMLElement>('.lobby-deployment__masthead');
    const rail = root.querySelector<HTMLElement>('.lobby-deployment__mode-rail');
    const quickDuel = root.querySelector<HTMLElement>('.lobby-quick-duel');
    const tabs = root.querySelector('.lobby-tabs');
    const panel = root.querySelector('[role="tabpanel"]');
    const context = root.querySelector('.lobby-mode-context');
    expect(title?.textContent).toBe('singedTerra');
    expect(commandHeader?.tagName).toBe('DIV');
    expect(masthead?.querySelectorAll('header')).toHaveLength(0);
    expect(commandHeader?.getAttribute('aria-label')).toBe('Pre-game command preparation');
    expect(commandHeader?.textContent).toBe('COMMAND PREPARATION');
    expect(commandHeader?.querySelector('h2')?.textContent).toBe('COMMAND PREPARATION');
    expect(rejoin?.querySelector('.lobby-rejoin-text')?.textContent)
      .toBe('You have a game in progress.');
    expect([...root.children]).toEqual([deployment]);
    expect([...masthead!.children]).toEqual([
      title,
      commandHeader,
      account,
      rejoin,
    ]);
    expect([...deployment!.children]).toEqual([
      masthead,
      rail,
      context,
      panel,
      vehiclePreview,
      controls,
    ]);
    expect([...rail!.children]).toEqual([quickDuel, tabs]);
    expect([...panel!.children]).toEqual([content]);
    expect(button(root, 'Rejoin your game').type).toBe('button');
  });

  it('renders active primary tabs and routes tab and rejoin actions', () => {
    const onTabChange = vi.fn();
    const onRejoin = vi.fn();
    const root = buildLobbyShellView(options({ onTabChange, onRejoin }));
    const hotSeat = button(root, 'Hot Seat');
    const online = button(root, 'Play Online');
    const rejoin = button(root, 'Rejoin your game');

    expect(hotSeat.className).toBe('lobby-tab active');
    expect(online.className).toBe('lobby-tab');
    expect(hotSeat.type).toBe('button');
    expect(online.type).toBe('button');
    hotSeat.click();
    online.click();
    rejoin.click();
    expect(onTabChange.mock.calls).toEqual([['hotseat'], ['online']]);
    expect(onRejoin).toHaveBeenCalledOnce();
    expect(onRejoin).toHaveBeenCalledWith();
  });

  it('renders one Quick Duel briefing before the mode tablist and activates it once', () => {
    const onQuickDuel = vi.fn();
    const root = buildLobbyShellView(options({ onQuickDuel }));
    const quickDuel = root.querySelector<HTMLElement>('.lobby-quick-duel')!;
    const quickDuelAction = button(root, 'Quick Duel vs CPU');
    const rail = root.querySelector<HTMLElement>('.lobby-deployment__mode-rail')!;
    const tabs = root.querySelector<HTMLElement>('.lobby-tabs')!;

    expect(quickDuel.tagName).toBe('SECTION');
    expect(quickDuel.querySelector('.lobby-quick-duel__title')?.textContent).toBe('Quick Duel');
    expect(quickDuel.querySelector('.lobby-quick-duel__description')?.textContent)
      .toBe('Deploy one player against a medium CPU.');
    expect(quickDuel.querySelector('.lobby-quick-duel__action')).toBe(quickDuelAction);
    expect(quickDuel.querySelectorAll('button')).toHaveLength(1);
    expect([...rail.children]).toEqual([quickDuel, tabs]);
    expect([...root.querySelectorAll('button')]
      .filter((candidate) => candidate.textContent === 'Quick Duel vs CPU')).toHaveLength(1);

    quickDuelAction.click();

    expect(onQuickDuel).toHaveBeenCalledOnce();
    expect(onQuickDuel).toHaveBeenCalledWith();
  });

  it('links the selected play mode tab to its setup panel', () => {
    const root = buildLobbyShellView(options());
    const tabs = root.querySelector<HTMLElement>('.lobby-tabs')!;
    const hotSeat = button(root, 'Hot Seat');
    const online = button(root, 'Play Online');
    const panel = root.querySelector<HTMLElement>('[role="tabpanel"]')!;

    expect(tabs.getAttribute('role')).toBe('tablist');
    expect(tabs.getAttribute('aria-label')).toBe('Choose play mode');
    expect(hotSeat.getAttribute('role')).toBe('tab');
    expect(hotSeat.getAttribute('aria-selected')).toBe('true');
    expect(online.getAttribute('role')).toBe('tab');
    expect(online.getAttribute('aria-selected')).toBe('false');
    expect(panel.getAttribute('aria-labelledby')).toBe(hotSeat.id);
    expect(hotSeat.getAttribute('aria-controls')).toBe(panel.id);
    expect(online.getAttribute('aria-controls')).toBe(panel.id);
  });

  it.each([
    ['hotseat', 'Hot Seat', 'Set your crew, then start a shared-screen match.'],
    ['online', 'Play Online', 'Create a room, join by code, or browse public games.'],
  ] as const)('states the selected %s journey before setup controls', (activeTab, title, description) => {
    const root = buildLobbyShellView(options({ activeTab }));
    const panel = root.querySelector<HTMLElement>('[role="tabpanel"]')!;
    const context = root.querySelector<HTMLElement>('.lobby-mode-context')!;
    const deployment = root.querySelector<HTMLElement>('.lobby-deployment')!;

    expect(context.querySelector('h2')?.textContent).toBe(title);
    expect(context.querySelector('p')?.textContent).toBe(description);
    expect(context.querySelectorAll('button, input, select, a')).toHaveLength(0);
    expect([...deployment.children].indexOf(context))
      .toBeLessThan([...deployment.children].indexOf(panel));
  });

  it('routes cyclic Arrow keys and Home End keys through the existing mode callback', () => {
    const hotSeatChange = vi.fn();
    const hotSeatRoot = buildLobbyShellView(options({ onTabChange: hotSeatChange }));
    const hotSeat = button(hotSeatRoot, 'Hot Seat');

    hotSeat.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    hotSeat.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    hotSeat.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    hotSeat.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(hotSeatChange.mock.calls).toEqual([['online'], ['online'], ['online'], ['hotseat']]);

    const onlineChange = vi.fn();
    const onlineRoot = buildLobbyShellView(options({ activeTab: 'online', onTabChange: onlineChange }));
    const online = button(onlineRoot, 'Play Online');

    online.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    online.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(onlineChange.mock.calls).toEqual([['hotseat'], ['hotseat']]);
  });

  it('omits rejoin, marks Online active, and preserves the online wrapper', () => {
    const subView = section('online-sub-view');
    const onlineView = buildLobbyOnlineView(subView);
    const root = buildLobbyShellView(options({
      activeTab: 'online',
      rejoinAvailable: false,
      content: onlineView,
    }));

    expect(root.querySelector('.lobby-rejoin-banner')).toBeNull();
    expect(button(root, 'Hot Seat').className).toBe('lobby-tab');
    expect(button(root, 'Play Online').className).toBe('lobby-tab active');
    expect(onlineView.tagName).toBe('DIV');
    expect(onlineView.className).toBe('');
    expect([...onlineView.children]).toEqual([subView]);
  });

  it('omits the account slot when optional accounts are unavailable', () => {
    const root = buildLobbyShellView(options({ account: null }));

    expect(root.querySelector('[data-section="account"]')).toBeNull();
    expect(button(root, 'Hot Seat')).toBeTruthy();
  });
});

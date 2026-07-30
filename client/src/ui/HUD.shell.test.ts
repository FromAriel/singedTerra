import { afterEach, describe, expect, it } from 'vitest';
import { GameEngine } from '@shared/engine/GameEngine';
import { HUD } from './HUD';
import type { GameState } from '@shared/types/GameState';

interface MountedShell {
  root: HTMLElement;
  modal: HTMLElement;
  hud: HUD;
  state: GameState;
}

function mountHarness(): MountedShell {
  const root = document.createElement('div');
  const overlay = document.createElement('div');
  const modal = document.createElement('div');
  document.body.append(root, overlay, modal);
  const hud = new HUD(root, overlay, modal);
  const engine = new GameEngine({
    players: [
      { name: 'Alice', color: '#e84d4d' },
      { name: 'Bob', color: '#4d8ce8' },
    ],
    maxPlayers: 2,
    seed: 1,
  });
  const state = engine.getState();
  hud.update(state);
  return { root, modal, hud, state };
}

function mount(): HTMLElement {
  return mountHarness().root;
}

afterEach(() => {
  document.body.innerHTML = '';
  document.head.querySelector('#st-hud-style')?.remove();
  localStorage.clear();
});

describe('HUD single-screen combat shell', () => {
  it('marks one shell and applies the shared section rhythm to every rail region', () => {
    const root = mount();

    expect(root.classList.contains('st-ui-shell')).toBe(true);
    expect(root.getAttribute('data-ui')).toBe('combat-rail');
    expect(root.querySelector('.st-hud__players')?.classList.contains('st-ui-section')).toBe(true);
    expect(root.querySelector('.st-hud__instruments')?.classList.contains('st-ui-section')).toBe(true);
    expect(root.querySelector('.st-hud__active-row')?.classList.contains('st-ui-section')).toBe(true);
    expect(root.querySelector('.st-hud__turn-actions')?.classList.contains('st-ui-section')).toBe(true);
    expect(root.querySelector('.st-hud__store-btn')?.classList.contains('st-ui-action')).toBe(true);
    expect(root.querySelector('.st-hud__primary-action')?.classList.contains('st-ui-action')).toBe(true);
    expect(root.querySelector('.st-hud__strip')?.classList.contains('st-ui-section')).toBe(true);
  });

  it('uses exact decorative SVG icons while visible text keeps actions named', () => {
    const root = mount();
    const menu = root.querySelector<HTMLButtonElement>('.st-hud__menu')!;
    const store = root.querySelector<HTMLButtonElement>('.st-hud__store-btn')!;
    const arsenal = root.querySelector<HTMLElement>('.st-hud__strip-title')!;
    const icons = root.querySelectorAll<SVGSVGElement>('svg.st-ui-icon');
    const iconNames = [...icons].map((icon) => icon.dataset['icon']);
    const iconPaths = Object.fromEntries(
      [...icons].map((icon) => [
        icon.dataset['icon'],
        [...icon.querySelectorAll('path')].map((path) => path.getAttribute('d')),
      ]),
    );

    expect(menu.getAttribute('aria-label')).toBe('Menu');
    expect(menu.textContent).toContain('Menu');
    expect(store.getAttribute('aria-label')).toMatch(/Store/);
    expect(store.textContent).toContain('Store');
    expect(arsenal.textContent).toContain('Arsenal');
    expect(iconNames).toEqual(['menu', 'store', 'fire', 'arsenal', 'disclosure']);
    expect(iconPaths).toEqual({
      menu: ['M4 5h16', 'M4 12h16', 'M4 19h16'],
      store: [
        'M16 10a4 4 0 0 1-8 0',
        'M3.103 6.034h17.794',
        'M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z',
      ],
      fire: [],
      arsenal: [
        'M12 22v-9',
        'M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z',
        'M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13',
        'M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z',
      ],
      disclosure: ['m6 9 6 6 6-6'],
    });
    for (const icon of icons) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.getAttribute('focusable')).toBe('false');
    }
  });

  it('exposes the arsenal as a controlled in-rail drawer', () => {
    const root = mount();
    const strip = root.querySelector<HTMLElement>('.st-hud__strip')!;
    const toggle = root.querySelector<HTMLButtonElement>('.st-hud__strip-toggle')!;
    const grid = root.querySelector<HTMLElement>('.st-hud__strip-grid')!;

    expect(strip.classList.contains('st-hud__strip--collapsed')).toBe(true);
    expect(strip.getAttribute('data-ui')).toBe('arsenal-drawer');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Expand arsenal');
    expect(toggle.textContent).toContain('Expand');
    expect(toggle.getAttribute('aria-controls')).toBe(grid.id);
    expect(grid.id).not.toBe('');
    expect(grid.getAttribute('role')).toBe('region');
    expect(grid.getAttribute('aria-label')).toBe('Weapon arsenal');

    toggle.click();
    expect(strip.classList.contains('st-hud__strip--open')).toBe(true);
    expect(strip.classList.contains('st-hud__strip--collapsed')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Collapse arsenal');
    expect(toggle.textContent).toContain('Close');
    for (const sibling of [...root.children]) {
      if (sibling !== strip) expect((sibling as HTMLElement).inert).toBe(true);
    }

    const firstWeapon = grid.querySelector<HTMLButtonElement>('.st-hud__weapon-btn')!;
    firstWeapon.focus();
    strip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).toBe(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    for (const sibling of [...root.children]) {
      if (sibling !== strip) expect((sibling as HTMLElement).inert).toBe(false);
    }

    toggle.click();
    toggle.click();
    expect(toggle.getAttribute('aria-label')).toBe('Expand arsenal');
    expect(toggle.textContent).toContain('Expand');
  });

  it('keeps each drawer control relationship unique across HUD instances', () => {
    const first = mount();
    const second = mount();
    const firstGrid = first.querySelector<HTMLElement>('.st-hud__strip-grid')!;
    const secondGrid = second.querySelector<HTMLElement>('.st-hud__strip-grid')!;

    expect(firstGrid.id).not.toBe(secondGrid.id);
    expect(first.querySelector('.st-hud__strip-toggle')?.getAttribute('aria-controls'))
      .toBe(firstGrid.id);
    expect(second.querySelector('.st-hud__strip-toggle')?.getAttribute('aria-controls'))
      .toBe(secondGrid.id);
  });

  it('preserves weapon selection and store behavior through the shell controls', () => {
    const { root, modal, hud, state } = mountHarness();
    const selected: string[] = [];
    hud.onWeaponSelect((weapon) => selected.push(weapon));
    root.querySelector<HTMLButtonElement>('.st-hud__strip-toggle')!.click();

    const missile = root.querySelector<HTMLButtonElement>(
      '.st-hud__weapon-btn[data-weapon="missile"]',
    )!;
    missile.click();
    expect(selected).toEqual(['missile']);
    const tank = state.tanks.find((candidate) => candidate.id === state.activePlayerId)!;
    tank.selectedWeapon = 'missile';
    hud.update(state);
    expect(missile.classList.contains('st-hud__weapon-btn--active')).toBe(true);
    expect(missile.getAttribute('aria-pressed')).toBe('true');
    expect(
      root.querySelector<HTMLButtonElement>(
        '.st-hud__weapon-btn[data-weapon="baby_missile"]',
      )!.getAttribute('aria-pressed'),
    ).toBe('false');

    const strip = root.querySelector('.st-hud__strip')!;
    const store = modal.querySelector('.st-hud__store')!;
    root.querySelector<HTMLButtonElement>('.st-hud__store-btn')!.click();
    expect(store.classList.contains('st-hud__store--hidden')).toBe(false);
    expect(strip.classList.contains('st-hud__strip--open')).toBe(true);
    modal.querySelector<HTMLButtonElement>('.st-hud__store-close')!.click();
    expect(store.classList.contains('st-hud__store--hidden')).toBe(true);
    expect(strip.classList.contains('st-hud__strip--open')).toBe(true);
    expect(missile.classList.contains('st-hud__weapon-btn--active')).toBe(true);
  });
});

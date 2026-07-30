import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Lobby, type LobbyConfig } from './Lobby';

describe('Lobby tank Garage', () => {
  let root: HTMLDivElement;
  let onReady: ReturnType<typeof vi.fn<(config: LobbyConfig) => void>>;

  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, '', '/');
    root = document.createElement('div');
    root.id = 'lobby';
    document.body.append(root);
    onReady = vi.fn();
  });

  afterEach(() => {
    root.remove();
    vi.restoreAllMocks();
  });

  it('mixes four slots per hot-seat player and submits the exact loadout', () => {
    const lobby = new Lobby(root, onReady);
    lobby.show();

    const garages = root.querySelectorAll<HTMLElement>('.lobby-garage');
    expect(garages).toHaveLength(2);
    let playerTwo = root.querySelector<HTMLElement>(
      '.lobby-garage[data-owner="player-2"]',
    )!;
    expect(playerTwo).not.toBeNull();
    expect(playerTwo.querySelectorAll('[data-preset]')).toHaveLength(3);
    expect(playerTwo.querySelectorAll('[data-slot]')).toHaveLength(4);

    playerTwo.querySelector<HTMLButtonElement>('[data-preset="ranger"]')!.click();
    playerTwo = root.querySelector<HTMLElement>(
      '.lobby-garage[data-owner="player-2"]',
    )!;
    playerTwo.querySelector<HTMLButtonElement>('[data-slot="turret"]')!.click();

    root.querySelector<HTMLButtonElement>('.lobby-start')!.click();

    const config = onReady.mock.calls[0]![0];
    expect(config.players[0].loadout).toEqual({
      treads: 'foundry',
      hull: 'foundry',
      turret: 'foundry',
      barrel: 'foundry',
    });
    expect(config.players[1].loadout).toEqual({
      treads: 'ranger',
      hull: 'ranger',
      turret: 'bulwark',
      barrel: 'ranger',
    });
  });

  it('exposes the same Garage on the online create form', () => {
    const lobby = new Lobby(root, onReady);
    lobby.show();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Play Online')!
      .click();

    const garage = root.querySelector<HTMLElement>(
      '.lobby-garage[data-owner="online-player"]',
    );
    expect(garage).not.toBeNull();
    expect(garage!.querySelector('[data-preset="bulwark"]')).not.toBeNull();
    expect(root.querySelectorAll('.lobby-preview canvas')).toHaveLength(1);
  });

  it('previews the joiner color in join mode instead of the host color', () => {
    const lobby = new Lobby(root, onReady);
    lobby.show();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Play Online')!
      .click();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent === 'Join Room instead')!
      .click();

    expect(
      root.querySelector<HTMLElement>('.lobby-preview__tank')!
        .style.getPropertyValue('--tank-color'),
    ).toBe('#4d8ce8');
  });
});

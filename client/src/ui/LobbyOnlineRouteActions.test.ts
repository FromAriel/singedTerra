import { describe, expect, it, vi } from 'vitest';
import { buildOnlineRouteActions } from './LobbyOnlineRouteActions';

function button(label: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'lobby-btn';
  element.textContent = label;
  return element;
}

describe('buildOnlineRouteActions', () => {
  it('keeps the current route primary and groups direct alternative routes semantically', () => {
    const create = button('Create Room');
    const join = vi.fn();
    const browse = vi.fn();

    const root = buildOnlineRouteActions(create, [
      { id: 'join-code', label: 'Join with a code', onClick: join },
      { id: 'browse', label: 'Browse public rooms', onClick: browse },
    ]);

    expect(root.className).toBe('lobby-online-actions');
    expect(root.firstElementChild).toBe(create);
    expect(create.classList.contains('lobby-online-primary')).toBe(true);

    const alternatives = root.querySelector<HTMLElement>(
      'nav[aria-label="Other ways to play online"]',
    );
    expect(alternatives?.querySelector('p')?.textContent).toBe('Other ways to play online');
    expect([...alternatives!.querySelectorAll('button')].map((item) => item.textContent))
      .toEqual(['Join with a code', 'Browse public rooms']);
    expect(alternatives!.querySelector('button[data-online-route="join-code"]')?.textContent)
      .toBe('Join with a code');
    expect(alternatives!.querySelector('button[data-online-route="browse"]')?.textContent)
      .toBe('Browse public rooms');

    alternatives!.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
    alternatives!.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
    expect(join).toHaveBeenCalledOnce();
    expect(browse).toHaveBeenCalledOnce();
  });
});

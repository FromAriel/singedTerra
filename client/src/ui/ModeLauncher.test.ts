import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Slice 3 mode launcher', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<div id="st-splash"></div>';
    vi.resetModules();
  });

  it('makes all three user-facing modes visible on the default launch', async () => {
    const { mountModeLauncher } = await import('./ModeLauncher');
    mountModeLauncher();

    const launcher = document.getElementById('st-mode-launcher');
    expect(launcher).not.toBeNull();
    expect(launcher?.textContent).toContain('Classic');
    expect(launcher?.textContent).toContain('Apocalypse');
    expect(launcher?.textContent).toContain('Arsenal Lab');

    const hrefs = [...launcher!.querySelectorAll<HTMLAnchorElement>('a')]
      .map((anchor) => anchor.getAttribute('href'));
    expect(hrefs.some((href) => href?.endsWith('apocalypse.html'))).toBe(true);
    expect(hrefs.some((href) => href?.endsWith('arsenal.html'))).toBe(true);
  });

  it('keeps Classic one-click and removes the mode overlay', async () => {
    vi.useFakeTimers();
    const splash = document.getElementById('st-splash')!;
    const click = vi.fn();
    splash.addEventListener('click', click);

    const { mountModeLauncher } = await import('./ModeLauncher');
    mountModeLauncher();
    const classic = document.querySelector<HTMLButtonElement>('[data-mode="classic"]');
    expect(classic).not.toBeNull();
    classic!.click();

    expect(document.getElementById('st-mode-launcher')).toBeNull();
    vi.runAllTimers();
    expect(click).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

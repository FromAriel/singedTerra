import { describe, expect, it } from 'vitest';
import { resolveInitialArsenalCollapsed } from './arsenalPreference';

describe('resolveInitialArsenalCollapsed', () => {
  it('starts the drawer closed when no valid preference exists', () => {
    expect(resolveInitialArsenalCollapsed(null)).toBe(true);
    expect(resolveInitialArsenalCollapsed('unexpected')).toBe(true);
  });

  it('lets either saved preference override the closed default', () => {
    expect(resolveInitialArsenalCollapsed('1')).toBe(true);
    expect(resolveInitialArsenalCollapsed('0')).toBe(false);
  });
});

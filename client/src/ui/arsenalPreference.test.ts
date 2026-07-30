import { describe, expect, it } from 'vitest';
import { COMPACT_STAGE_QUERY, resolveInitialArsenalCollapsed } from './arsenalPreference';

describe('resolveInitialArsenalCollapsed', () => {
  it('uses the compact-stage default only when no valid preference exists', () => {
    expect(resolveInitialArsenalCollapsed(null, true)).toBe(true);
    expect(resolveInitialArsenalCollapsed(null, false)).toBe(false);
    expect(resolveInitialArsenalCollapsed('unexpected', true)).toBe(true);
    expect(resolveInitialArsenalCollapsed('unexpected', false)).toBe(false);
  });

  it('lets either saved preference override the viewport', () => {
    expect(resolveInitialArsenalCollapsed('1', false)).toBe(true);
    expect(resolveInitialArsenalCollapsed('1', true)).toBe(true);
    expect(resolveInitialArsenalCollapsed('0', false)).toBe(false);
    expect(resolveInitialArsenalCollapsed('0', true)).toBe(false);
  });

  it('pins the compact-stage media query to the whole-app scale threshold', () => {
    expect(COMPACT_STAGE_QUERY).toBe(
      '(max-width: 1171px), (max-height: 479px), (pointer: coarse) and (max-height: 700px)',
    );
  });
});

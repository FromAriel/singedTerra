import { describe, expect, it } from 'vitest';
import {
  IMPACT_KICK_MAX,
  IMPACT_KICK_THRESHOLD,
  impactKick,
} from './impactKick';

function magnitude(vector: { x: number; y: number }): number {
  return Math.hypot(vector.x, vector.y);
}

describe('impactKick', () => {
  it('suppresses small blasts and grows monotonically above the threshold', () => {
    const tiny = impactKick(0, 300, IMPACT_KICK_THRESHOLD - 1, 1200, 600);
    const small = impactKick(0, 300, IMPACT_KICK_THRESHOLD, 1200, 600);
    const medium = impactKick(0, 300, IMPACT_KICK_THRESHOLD + 10, 1200, 600);
    const heavy = impactKick(0, 300, IMPACT_KICK_THRESHOLD + 30, 1200, 600);

    expect(tiny).toEqual({ x: 0, y: 0 });
    expect(small).toEqual({ x: 0, y: 0 });
    expect(magnitude(medium)).toBeGreaterThan(0);
    expect(magnitude(heavy)).toBeGreaterThan(magnitude(medium));
  });

  it('caps extreme detonations at the viewport-safe maximum', () => {
    const kick = impactKick(0, 300, 10_000, 1200, 600);

    expect(magnitude(kick)).toBeCloseTo(IMPACT_KICK_MAX, 8);
  });

  it('recoils away from left, right, upper, and lower impacts', () => {
    const radius = IMPACT_KICK_THRESHOLD + 30;
    const left = impactKick(0, 300, radius, 1200, 600);
    const right = impactKick(1200, 300, radius, 1200, 600);
    const above = impactKick(600, 0, radius, 1200, 600);
    const below = impactKick(600, 600, radius, 1200, 600);

    expect(left.x).toBeGreaterThan(0);
    expect(right.x).toBeLessThan(0);
    expect(above.y).toBeGreaterThan(0);
    expect(below.y).toBeLessThan(0);
    expect(left.x).toBeCloseTo(-right.x, 8);
    expect(above.y).toBeCloseTo(-below.y, 8);
  });

  it('returns a finite zero vector for centered or invalid inputs', () => {
    expect(impactKick(600, 300, 80, 1200, 600)).toEqual({ x: 0, y: 0 });
    const invalidInputs = [
      [Number.NaN, 0, 80, 1200, 600],
      [Number.POSITIVE_INFINITY, 0, 80, 1200, 600],
      [0, Number.NaN, 80, 1200, 600],
      [0, Number.NEGATIVE_INFINITY, 80, 1200, 600],
      [0, 0, Number.NaN, 1200, 600],
      [0, 0, Number.POSITIVE_INFINITY, 1200, 600],
      [0, 0, 80, Number.NaN, 600],
      [0, 0, 80, Number.POSITIVE_INFINITY, 600],
      [0, 0, 80, 0, 600],
      [0, 0, 80, -1, 600],
      [0, 0, 80, 1200, Number.NaN],
      [0, 0, 80, 1200, Number.POSITIVE_INFINITY],
      [0, 0, 80, 1200, 0],
      [0, 0, 80, 1200, -1],
    ] as const;
    for (const args of invalidInputs) {
      expect(impactKick(args[0], args[1], args[2], args[3], args[4]))
        .toEqual({ x: 0, y: 0 });
    }
  });
});

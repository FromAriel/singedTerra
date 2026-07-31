import { describe, expect, it } from 'vitest';
import type { ExplosionVisualFamily } from './explosionVisuals';
import {
  BLAST_LIGHT_MAX_ALPHA,
  BLAST_LIGHT_MAX_RADIUS,
  getBlastLightProfile,
} from './blastLighting';

const FAMILIES: ExplosionVisualFamily[] = [
  'conventional',
  'nuclear',
  'earth',
  'incendiary',
  'scatter',
  'funky',
  'mine',
];

describe('getBlastLightProfile', () => {
  it('maps every visual family to finite bounded light output without mutating input', () => {
    for (const family of FAMILIES) {
      const input = { family, reachRadius: 54, age: 0, lifeFrames: 80 } as const;
      const before = { ...input };
      const profile = getBlastLightProfile(input);

      expect(profile.radius).toBeGreaterThan(0);
      expect(profile.radius).toBeLessThanOrEqual(BLAST_LIGHT_MAX_RADIUS);
      expect(profile.alpha).toBeGreaterThan(0);
      expect(profile.alpha).toBeLessThanOrEqual(BLAST_LIGHT_MAX_ALPHA);
      expect(Number.isFinite(profile.radius)).toBe(true);
      expect(Number.isFinite(profile.alpha)).toBe(true);
      expect(input).toEqual(before);
    }
  });

  it('pins a unique expected light profile for every visual family', () => {
    const base = { reachRadius: 54, age: 0, lifeFrames: 80 } as const;
    const expected = {
      conventional: { radius: 91.8, alpha: 0.42 },
      nuclear: { radius: 118.8, alpha: 0.68 },
      earth: { radius: 67.5, alpha: 0.26 },
      incendiary: { radius: 89.1, alpha: 0.55 },
      scatter: { radius: 72.9, alpha: 0.32 },
      funky: { radius: 99.9, alpha: 0.5 },
      mine: { radius: 75.6, alpha: 0.36 },
    } satisfies Record<ExplosionVisualFamily, { radius: number; alpha: number }>;

    const signatures = FAMILIES.map((family) => {
      const profile = getBlastLightProfile({ ...base, family });
      expect(profile.radius).toBeCloseTo(expected[family].radius);
      expect(profile.alpha).toBeCloseTo(expected[family].alpha);
      return `${profile.radius}:${profile.alpha}`;
    });
    expect(new Set(signatures).size).toBe(FAMILIES.length);
  });

  it('scales from shared visual reach and caps very large lights', () => {
    const small = getBlastLightProfile({
      family: 'conventional', reachRadius: 20, age: 0, lifeFrames: 80,
    });
    const medium = getBlastLightProfile({
      family: 'conventional', reachRadius: 40, age: 0, lifeFrames: 80,
    });
    const huge = getBlastLightProfile({
      family: 'nuclear', reachRadius: 10_000, age: 0, lifeFrames: 80,
    });

    expect(medium.radius).toBeCloseTo(small.radius * 2);
    expect(huge.radius).toBe(BLAST_LIGHT_MAX_RADIUS);
  });

  it('holds briefly, then decays monotonically to exact zero at expiry', () => {
    const sample = (age: number) => getBlastLightProfile({
      family: 'incendiary', reachRadius: 60, age, lifeFrames: 100,
    }).alpha;

    expect(sample(0)).toBe(sample(7));
    let previous = sample(8);
    for (let age = 9; age < 100; age++) {
      const current = sample(age);
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
    expect(sample(50)).toBeLessThan(sample(8));
    expect(sample(99)).toBeLessThan(sample(50));
    expect(sample(99)).toBeGreaterThan(0);
    expect(sample(100)).toBe(0);
    expect(sample(101)).toBe(0);
  });

  it('fails closed for malformed or non-positive inputs', () => {
    const invalid = [
      { reachRadius: 0, age: 0, lifeFrames: 80 },
      { reachRadius: -1, age: 0, lifeFrames: 80 },
      { reachRadius: Number.NaN, age: 0, lifeFrames: 80 },
      { reachRadius: Number.POSITIVE_INFINITY, age: 0, lifeFrames: 80 },
      { reachRadius: 54, age: -1, lifeFrames: 80 },
      { reachRadius: 54, age: Number.NaN, lifeFrames: 80 },
      { reachRadius: 54, age: 0, lifeFrames: 0 },
      { reachRadius: 54, age: 0, lifeFrames: -1 },
      { reachRadius: 54, age: 0, lifeFrames: Number.POSITIVE_INFINITY },
    ];

    for (const values of invalid) {
      expect(getBlastLightProfile({ family: 'mine', ...values })).toEqual({
        radius: 0,
        alpha: 0,
      });
    }
  });
});

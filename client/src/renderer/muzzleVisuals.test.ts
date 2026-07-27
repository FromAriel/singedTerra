import { describe, expect, it } from 'vitest';
import { WEAPONS, type WeaponType } from '@shared/engine/WeaponSystem';
import {
  getMuzzleVisualProfile,
  type MuzzleMotif,
} from './muzzleVisuals';

describe('getMuzzleVisualProfile', () => {
  it('maps the complete weapon union to finite bounded launch values', () => {
    for (const weaponType of Object.keys(WEAPONS) as WeaponType[]) {
      const profile = getMuzzleVisualProfile(weaponType);
      expect(profile.accent).toBe(WEAPONS[weaponType].detonation.color);
      expect(profile.scale).toBeGreaterThanOrEqual(0.8);
      expect(profile.scale).toBeLessThanOrEqual(1.8);
      expect(profile.sparkCount).toBeGreaterThanOrEqual(6);
      expect(profile.sparkCount).toBeLessThanOrEqual(18);
      expect(profile.spread).toBeGreaterThan(0);
      expect(profile.spread).toBeLessThanOrEqual(1.1);
      expect(profile.speedMin).toBeGreaterThan(0);
      expect(profile.speedMax).toBeGreaterThan(profile.speedMin);
      expect(profile.speedMax).toBeLessThanOrEqual(8);
      expect(profile.life).toBeGreaterThanOrEqual(6);
      expect(profile.life).toBeLessThanOrEqual(12);
    }
  });

  it('pins the major weapon families to distinct launch motifs', () => {
    const expected = {
      baby_missile: 'needle',
      missile: 'needle',
      heavy_missile: 'heavy',
      baby_nuke: 'nuclear',
      nuke: 'nuclear',
      dirt_bomb: 'earth',
      bouncing_betty: 'mine',
      funky_bomb: 'funky',
      napalm: 'flame',
      cluster_bomb: 'fan',
      mirv: 'fan',
      deaths_head: 'fan',
      riot_bomb: 'earth',
      hot_napalm: 'flame',
      shield: 'needle',
    } satisfies Record<WeaponType, MuzzleMotif>;

    for (const weaponType of Object.keys(expected) as WeaponType[]) {
      expect(getMuzzleVisualProfile(weaponType).motif).toBe(expected[weaponType]);
    }
  });

  it('gives premium variants more launch weight than their light counterparts', () => {
    expect(getMuzzleVisualProfile('heavy_missile').scale)
      .toBeGreaterThan(getMuzzleVisualProfile('baby_missile').scale);
    expect(getMuzzleVisualProfile('nuke').sparkCount)
      .toBeGreaterThan(getMuzzleVisualProfile('baby_nuke').sparkCount);
    expect(getMuzzleVisualProfile('hot_napalm').scale)
      .toBeGreaterThan(getMuzzleVisualProfile('napalm').scale);
  });

  it('fails malformed or absent weapon identity closed to the baby-missile baseline', () => {
    const baseline = getMuzzleVisualProfile('baby_missile');
    expect(getMuzzleVisualProfile(undefined)).toEqual(baseline);
    expect(getMuzzleVisualProfile(null)).toEqual(baseline);
    expect(getMuzzleVisualProfile('not-a-weapon')).toEqual(baseline);
    expect(getMuzzleVisualProfile(42)).toEqual(baseline);
  });

  it('returns fresh immutable values without changing shared definitions', () => {
    const before = structuredClone(WEAPONS.funky_bomb);
    const first = getMuzzleVisualProfile('funky_bomb');
    const second = getMuzzleVisualProfile('funky_bomb');

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    expect(WEAPONS.funky_bomb).toEqual(before);
  });
});

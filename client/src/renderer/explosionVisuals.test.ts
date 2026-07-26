import { describe, expect, it } from 'vitest';
import {
  WEAPONS,
  type WeaponType,
} from '@shared/engine/WeaponSystem';
import { blastReachRadius } from '@shared/engine/BlastGeometry';
import type { ExplosionEvent } from '@shared/types/GameState';
import {
  getExplosionVisualProfile,
  type ExplosionVisualFamily,
} from './explosionVisuals';

function explosion(
  weaponType: WeaponType,
  overrides: Partial<ExplosionEvent> = {},
): ExplosionEvent {
  const detonation = WEAPONS[weaponType].detonation;
  return {
    id: 7,
    weaponType,
    cx: 320,
    cy: 240,
    radius: detonation.radius,
    style: detonation.style,
    color: detonation.color,
    durationFrames: detonation.durationFrames,
    ...overrides,
  };
}

describe('getExplosionVisualProfile', () => {
  it('maps the complete weapon union to finite values contained by authoritative reach', () => {
    for (const weaponType of Object.keys(WEAPONS) as WeaponType[]) {
      const event = explosion(weaponType);
      const before = { ...event };
      const profile = getExplosionVisualProfile(event);
      const expectedReach = blastReachRadius(event.radius, event.style);

      expect(profile.accent).toBe(event.color);
      expect(profile.reachRadius).toBe(expectedReach);
      expect(profile.coreRadius).toBeGreaterThanOrEqual(0);
      expect(profile.coreRadius).toBeLessThanOrEqual(expectedReach);
      expect(profile.detailRadius).toBeGreaterThanOrEqual(profile.coreRadius);
      expect(profile.detailRadius).toBeLessThanOrEqual(expectedReach);
      expect(profile.verticalScale).toBeGreaterThan(0);
      expect(profile.verticalScale).toBeLessThanOrEqual(1);
      expect(profile.detailCount).toBeGreaterThanOrEqual(2);
      expect(profile.detailCount).toBeLessThanOrEqual(12);
      expect(Object.values(profile).every((value) => (
        typeof value !== 'number' || Number.isFinite(value)
      ))).toBe(true);
      expect(event).toEqual(before);
    }
  });

  it('assigns an exhaustive semantic family to every payload', () => {
    const expected = {
      baby_missile: 'conventional',
      missile: 'conventional',
      heavy_missile: 'conventional',
      baby_nuke: 'nuclear',
      nuke: 'nuclear',
      dirt_bomb: 'earth',
      bouncing_betty: 'mine',
      funky_bomb: 'funky',
      napalm: 'incendiary',
      cluster_bomb: 'scatter',
      mirv: 'scatter',
      deaths_head: 'scatter',
      riot_bomb: 'earth',
      hot_napalm: 'incendiary',
      shield: 'conventional',
    } satisfies Record<WeaponType, ExplosionVisualFamily>;

    for (const weaponType of Object.keys(expected) as WeaponType[]) {
      expect(getExplosionVisualProfile(explosion(weaponType)).family)
        .toBe(expected[weaponType]);
    }
  });

  it('preserves the conventional fireball baseline', () => {
    const profile = getExplosionVisualProfile(explosion('baby_missile'));
    expect(profile).toMatchObject({
      family: 'conventional',
      accent: '#ffb347',
      verticalScale: 1,
      detailCount: 9,
    });
    expect(profile.coreRadius).toBeCloseTo(9.072);
    expect(profile.detailRadius).toBeCloseTo(25.272);
  });

  it('keeps normal and cluster reach on the shared style-aware contract', () => {
    const blast = explosion('missile', { radius: 40, style: 'blast' });
    const cluster = explosion('cluster_bomb', { radius: 40, style: 'cluster' });

    expect(getExplosionVisualProfile(blast).reachRadius).toBe(blastReachRadius(40, 'blast'));
    expect(getExplosionVisualProfile(cluster).reachRadius).toBe(blastReachRadius(40, 'cluster'));
    expect(getExplosionVisualProfile(blast).reachRadius)
      .toBeGreaterThan(getExplosionVisualProfile(cluster).reachRadius);
  });

  it('uses the event color as authoritative cosmetic input', () => {
    const event = explosion('nuke', { color: '#123abc' });
    expect(getExplosionVisualProfile(event).accent).toBe('#123abc');
    expect(WEAPONS.nuke.detonation.color).toBe('#fff7c2');
  });

  it('keeps zero-radius defensive events finite and contained', () => {
    expect(getExplosionVisualProfile(explosion('shield'))).toMatchObject({
      family: 'conventional',
      reachRadius: 0,
      coreRadius: 0,
      detailRadius: 0,
    });
  });

  it('fails closed to zero reach for malformed radii', () => {
    for (const radius of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
    ]) {
      expect(getExplosionVisualProfile(explosion('missile', { radius }))).toMatchObject({
        reachRadius: 0,
        coreRadius: 0,
        detailRadius: 0,
      });
    }
  });
});

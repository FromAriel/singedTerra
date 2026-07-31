import { describe, expect, it } from 'vitest';
import {
  WEAPONS,
  type WeaponType,
} from '@shared/engine/WeaponSystem';
import type { ProjectileState } from '@shared/types/GameState';
import {
  getProjectileVisualProfile,
  type ProjectileSilhouette,
} from './projectileVisuals';

function projectile(
  weaponType: WeaponType,
  overrides: Partial<ProjectileState> = {},
): ProjectileState {
  return {
    x: 120,
    y: 80,
    vx: 4,
    vy: -3,
    weaponType,
    age: 8,
    hasSplit: false,
    bounces: 0,
    ...overrides,
  };
}

describe('getProjectileVisualProfile', () => {
  it('maps the complete weapon union to finite bounded presentation values', () => {
    for (const weaponType of Object.keys(WEAPONS) as WeaponType[]) {
      const profile = getProjectileVisualProfile(projectile(weaponType));

      expect(profile.accent).toBe(WEAPONS[weaponType].detonation.color);
      expect(profile.rotation).toBeCloseTo(Math.atan2(-3, 4));
      expect(profile.coreRadius).toBeGreaterThan(0);
      expect(profile.coreRadius).toBeLessThanOrEqual(8);
      expect(profile.glowRadius).toBeGreaterThan(profile.coreRadius);
      expect(profile.glowRadius).toBeLessThanOrEqual(20);
      expect(profile.trailRadiusMin).toBeGreaterThan(0);
      expect(profile.trailRadiusMax).toBeGreaterThan(profile.trailRadiusMin);
      expect(profile.trailRadiusMax).toBeLessThanOrEqual(8);
      expect(profile.trailAlphaOld).toBeGreaterThanOrEqual(0);
      expect(profile.trailAlphaNew).toBeGreaterThan(profile.trailAlphaOld);
      expect(profile.trailAlphaNew).toBeLessThanOrEqual(0.6);
      expect(Number.isFinite(profile.rotation)).toBe(true);
    }
  });

  it('preserves the compact baby-missile baseline', () => {
    expect(getProjectileVisualProfile(projectile('baby_missile'))).toMatchObject({
      silhouette: 'shell',
      accent: '#ffb347',
      coreRadius: 3,
      glowRadius: 9,
      trailRadiusMin: 1.5,
      trailRadiusMax: 5,
      trailAlphaOld: 0.06,
      trailAlphaNew: 0.34,
    });
  });

  it('assigns distinct readable silhouettes to the major payload families', () => {
    const expected = {
      baby_missile: 'shell',
      missile: 'shell',
      heavy_missile: 'heavy',
      baby_nuke: 'nuclear',
      nuke: 'nuclear',
      dirt_bomb: 'earth',
      bouncing_betty: 'mine',
      funky_bomb: 'airburst',
      napalm: 'napalm',
      cluster_bomb: 'airburst',
      mirv: 'airburst',
      deaths_head: 'airburst',
      riot_bomb: 'earth',
      hot_napalm: 'napalm',
      sandhog: 'drill',
      shield: 'shell',
    } satisfies Record<WeaponType, ProjectileSilhouette>;

    for (const weaponType of Object.keys(expected) as WeaponType[]) {
      expect(getProjectileVisualProfile(projectile(weaponType)).silhouette)
        .toBe(expected[weaponType]);
    }
  });

  it('scales heavy and premium payloads above their lighter family members', () => {
    const baby = getProjectileVisualProfile(projectile('baby_missile'));
    const heavy = getProjectileVisualProfile(projectile('heavy_missile'));
    const babyNuke = getProjectileVisualProfile(projectile('baby_nuke'));
    const nuke = getProjectileVisualProfile(projectile('nuke'));
    const napalm = getProjectileVisualProfile(projectile('napalm'));
    const hotNapalm = getProjectileVisualProfile(projectile('hot_napalm'));

    expect(heavy.coreRadius).toBeGreaterThan(baby.coreRadius);
    expect(nuke.coreRadius).toBeGreaterThan(babyNuke.coreRadius);
    expect(hotNapalm.coreRadius).toBeGreaterThan(napalm.coreRadius);
  });

  it('makes airburst children smaller and visually distinct from their carrier', () => {
    for (const weaponType of ['cluster_bomb', 'mirv', 'funky_bomb', 'deaths_head'] as const) {
      const carrier = getProjectileVisualProfile(projectile(weaponType));
      const child = getProjectileVisualProfile(projectile(weaponType, { hasSplit: true }));

      expect(carrier.silhouette).toBe('airburst');
      expect(child.silhouette).toBe('submunition');
      expect(child.coreRadius).toBeLessThan(carrier.coreRadius);
      expect(child.glowRadius).toBeLessThan(carrier.glowRadius);
      expect(child.trailRadiusMax).toBeLessThan(carrier.trailRadiusMax);
    }
  });

  it('orients along finite velocity and falls back for every malformed component', () => {
    expect(getProjectileVisualProfile(projectile('missile', { vx: 0, vy: 5 })).rotation)
      .toBeCloseTo(Math.PI / 2);
    expect(getProjectileVisualProfile(projectile('missile', { vx: 0, vy: 0 })).rotation).toBe(0);
    expect(getProjectileVisualProfile(projectile('missile', { vx: Number.NaN })).rotation).toBe(0);
    expect(getProjectileVisualProfile(projectile('missile', { vy: Number.POSITIVE_INFINITY })).rotation)
      .toBe(0);
    expect(getProjectileVisualProfile(projectile('missile', {
      vx: Number.NEGATIVE_INFINITY,
      vy: Number.NaN,
    })).rotation).toBe(0);
  });

  it('does not mutate projectile state or shared weapon definitions', () => {
    const state = projectile('deaths_head', { hasSplit: true });
    const stateBefore = { ...state };
    const weaponBefore = structuredClone(WEAPONS.deaths_head);

    getProjectileVisualProfile(state);

    expect(state).toEqual(stateBefore);
    expect(WEAPONS.deaths_head).toEqual(weaponBefore);
  });
});

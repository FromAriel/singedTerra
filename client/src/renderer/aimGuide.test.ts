import { describe, expect, it } from 'vitest';
import type { GameState, TankState } from '@shared/types/GameState';
import { launchVelocity, stepProjectile } from '@shared/engine/Physics';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import {
  AIM_GUIDE_TICKS,
  buildLaunchGuide,
  getAimGuideMode,
} from './aimGuide';

function tank(overrides: Partial<TankState> = {}): TankState {
  return {
    id: 'p1',
    playerName: 'P1',
    color: '#ef4444',
    x: 120,
    y: 420,
    angle: 45,
    power: 50,
    health: 100,
    alive: true,
    selectedWeapon: 'baby_missile',
    ...overrides,
  } as TankState;
}

describe('skill-preserving aim guide', () => {
  it.each([20, 45, 90, 135, 160])(
    'leaves the authored muzzle coaxially for the opening run at %d°',
    (angle) => {
      const me = tank({ angle, power: 50 });
      const points = buildLaunchGuide(me);
      const tip = barrelTip(me, BARREL_LENGTH);
      const radians = angle * Math.PI / 180;
      const aim = { x: Math.cos(radians), y: -Math.sin(radians) };

      expect(points[0]).toEqual(tip);
      for (const point of points.slice(1, 4)) {
        const dx = point.x - tip.x;
        const dy = point.y - tip.y;
        const cross = dx * aim.y - dy * aim.x;
        const forward = dx * aim.x + dy * aim.y;
        expect(Math.abs(cross)).toBeLessThan(1e-8);
        expect(forward).toBeGreaterThan(0);
      }

    },
  );

  it('retains a non-ballistic flourish after the straight opening run', () => {
    const me = tank({ angle: 45, power: 50 });
    const points = buildLaunchGuide(me);
    const tip = barrelTip(me, BARREL_LENGTH);
    const radians = me.angle * Math.PI / 180;
    const aim = { x: Math.cos(radians), y: -Math.sin(radians) };
    const laterCross = (
      (points[7]!.x - tip.x) * aim.y
      - (points[7]!.y - tip.y) * aim.x
    );

    expect(Math.abs(laterCross)).toBeGreaterThan(0.25);
  });

  it('uses the same bounded launch hint on the opening turn and later turns', () => {
    const me = tank();
    const opening = { phase: 'PLAYER_TURN', turn: 0 } as GameState;
    const later = { ...opening, turn: 12 };

    expect(getAimGuideMode(opening, me, true, true)).toBe('launch');
    expect(getAimGuideMode(later, me, true, true)).toBe('launch');
  });

  it('never exposes a complete trajectory or impact point', () => {
    const me = tank({ power: 100 });
    const points = buildLaunchGuide(me);
    const tip = barrelTip(me, BARREL_LENGTH);

    expect(points).toHaveLength(AIM_GUIDE_TICKS);
    expect(points[0]).toEqual(tip);
    expect(Math.hypot(
      points[1].x - points[0].x,
      points[1].y - points[0].y,
    )).toBeLessThan(5);
    expect(Math.hypot(
      points.at(-1)!.x - tip.x,
      points.at(-1)!.y - tip.y,
    )).toBeLessThan(260);
  });

  it.each([
    { angle: 0, power: 10 },
    { angle: 15, power: 10 },
    { angle: 30, power: 20 },
  ])('does not reproduce authoritative low-power ballistics at $angle°/$power', ({
    angle,
    power,
  }) => {
    const me = tank({ angle, power });
    const cue = buildLaunchGuide(me);
    expect(cue).toHaveLength(AIM_GUIDE_TICKS);
    const tip = barrelTip(me, BARREL_LENGTH);
    const velocity = launchVelocity(angle, power);
    const exact = {
      ...tip,
      ...velocity,
      weaponType: 'baby_missile' as const,
      age: 0,
      hasSplit: true,
      bounces: 0,
    };

    expect(cue[0]).toEqual({ x: exact.x, y: exact.y });
    for (let tick = 1; tick < cue.length; tick++) {
      stepProjectile(exact, 0, 0.15);
      expect(cue[tick]).not.toEqual({ x: exact.x, y: exact.y });
    }
  });

  it('fails closed for hidden, inactive, or invalid guidance', () => {
    const me = tank();
    const turn = { phase: 'PLAYER_TURN', turn: 0 } as GameState;

    expect(getAimGuideMode(turn, me, false, true)).toBe('none');
    expect(getAimGuideMode(turn, me, true, false)).toBe('none');
    expect(getAimGuideMode({ ...turn, phase: 'FIRING' }, me, true, true)).toBe('none');
    expect(getAimGuideMode(turn, { ...me, alive: false }, true, true)).toBe('none');
    expect(buildLaunchGuide({ ...me, power: Number.NaN })).toEqual([]);
  });
});

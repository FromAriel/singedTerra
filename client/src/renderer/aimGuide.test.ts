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
    expect(points[0]).not.toEqual(tip);
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

    for (let tick = 0; tick < cue.length; tick++) {
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

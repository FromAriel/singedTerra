import type { GameState, TankState } from '@shared/types/GameState';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import { clamp } from '@shared/engine/math';

/**
 * A deliberately short, stylized projection: enough to communicate launch
 * direction and relative power, but never an authoritative ballistic path.
 */
export const AIM_GUIDE_TICKS = 14;

export interface AimGuidePoint {
  readonly x: number;
  readonly y: number;
}

export type AimGuideMode = 'none' | 'launch';

/** Decide whether the local player receives the bounded launch hint. */
export function getAimGuideMode(
  state: Pick<GameState, 'phase'>,
  tank: Readonly<TankState>,
  localControls: boolean,
  guideEnabled: boolean,
): AimGuideMode {
  return localControls
    && guideEnabled
    && state.phase === 'PLAYER_TURN'
    && tank.alive
    ? 'launch'
    : 'none';
}

/**
 * Build a local launch cue rather than a trajectory. The curve intentionally
 * ignores authoritative wind, gravity, terrain, tanks, walls, and the fixed-step
 * recurrence. It therefore cannot reveal a collision or solve a bank shot.
 */
export function buildLaunchGuide(
  tank: Readonly<TankState>,
): AimGuidePoint[] {
  if (
    !tank.alive
    || !Number.isFinite(tank.x)
    || !Number.isFinite(tank.y)
    || !Number.isFinite(tank.angle)
    || !Number.isFinite(tank.power)
  ) {
    return [];
  }

  const tip = barrelTip(tank, BARREL_LENGTH);
  const radians = tank.angle * Math.PI / 180;
  const powerRatio = Math.sqrt(clamp(tank.power / 100, 0, 1));
  const length = 48 + powerRatio * 78;
  const points: AimGuidePoint[] = [];
  for (let index = 0; index < AIM_GUIDE_TICKS; index++) {
    const progress = (index + 1) / AIM_GUIDE_TICKS;
    const distance = length * progress;
    // A small graphic-design lift makes this read as an open-ended vector,
    // not as the start of the canonical parabola.
    const flourish = Math.sin(Math.PI * progress) * 6;
    points.push({
      x: tip.x + Math.cos(radians) * distance,
      y: tip.y - Math.sin(radians) * distance - flourish,
    });
  }
  return points;
}

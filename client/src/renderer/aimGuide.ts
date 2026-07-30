import type { GameState, TankState } from '@shared/types/GameState';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import { clamp } from '@shared/engine/math';

/**
 * A deliberately short, stylized projection: enough to communicate launch
 * direction and relative power, but never an authoritative ballistic path.
 */
export const AIM_GUIDE_TICKS = 14;
/** Samples 0-3 remain exactly coaxial with the visible barrel. */
const AIM_GUIDE_STRAIGHT_POINTS = 4;

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
  // The first point is the exact shared muzzle. This keeps the visible barrel
  // and launch cue continuous while the later points retain the deliberately
  // non-ballistic flourish.
  const points: AimGuidePoint[] = [tip];
  for (let index = 1; index < AIM_GUIDE_TICKS; index++) {
    // Ease out of the muzzle so the first visible bead stays connected to the
    // barrel at gameplay scale; later beads open up into the same bounded cue.
    const progress = (index / (AIM_GUIDE_TICKS - 1)) ** 1.45;
    const distance = length * progress;
    // Keep the opening run exactly coaxial with the visible barrel. The
    // decorative lift starts only after the fourth sample, so the cue reads as
    // leaving the muzzle rather than as a second, bent barrel.
    const flourishProgress = clamp(
      (index - (AIM_GUIDE_STRAIGHT_POINTS - 1))
        / (AIM_GUIDE_TICKS - AIM_GUIDE_STRAIGHT_POINTS),
      0,
      1,
    );
    // A bounded graphic-design lift makes the far cue read as an open-ended
    // vector, not as the canonical parabola.
    const flourish = Math.sin(Math.PI * flourishProgress) * 6;
    points.push({
      x: tip.x + Math.cos(radians) * distance,
      y: tip.y - Math.sin(radians) * distance - flourish,
    });
  }
  return points;
}

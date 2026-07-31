import type { GameState, TankState } from '@shared/types/GameState';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import { clamp } from '@shared/engine/math';
import {
  launchVelocity,
  stepProjectile,
  sweepCollide,
} from '@shared/engine/Physics';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';

/**
 * Maximum authoritative physics steps in the deliberately short preview.
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
    && tank.selectedWeapon !== 'shield'
    ? 'launch'
    : 'none';
}

/**
 * Build a short honest trajectory from the same fixed-step primitives as a
 * fired shell. The preview ends at the legacy visual-reach cap, fourteen
 * physics ticks, or the first contact — whichever comes first. It never
 * continues into weapon-specific post-impact behavior.
 */
export function buildLaunchGuide(
  state: Pick<GameState, 'wind' | 'terrain' | 'tanks' | 'walls'>,
  tank: Readonly<TankState>,
  gravity: number,
): AimGuidePoint[] {
  if (
    !tank.alive
    || tank.selectedWeapon === 'shield'
    || !Number.isFinite(tank.x)
    || !Number.isFinite(tank.y)
    || !Number.isFinite(tank.angle)
    || !Number.isFinite(tank.power)
    || !Number.isFinite(state.wind)
    || !Number.isFinite(gravity)
    || gravity <= 0
  ) {
    return [];
  }

  const tip = barrelTip(tank, BARREL_LENGTH);
  const velocity = launchVelocity(tank.angle, tank.power);
  const speed = Math.hypot(velocity.vx, velocity.vy);
  const powerRatio = Math.sqrt(clamp(tank.power / 100, 0, 1));
  const maxLength = 48 + powerRatio * 78;
  const points: AimGuidePoint[] = [tip];
  const tangentLength = speed > 0 ? Math.min(4, speed * 0.4) : 0;
  const tangent = tangentLength > 0
    ? {
        x: tip.x + velocity.vx / speed * tangentLength,
        y: tip.y + velocity.vy / speed * tangentLength,
      }
    : null;
  let traveled = 0;
  const projectile = {
    x: tip.x,
    y: tip.y,
    vx: velocity.vx,
    vy: velocity.vy,
    weaponType: tank.selectedWeapon,
    age: 0,
    hasSplit: false,
    bounces: 0,
  };

  for (let tick = 0; tick < AIM_GUIDE_TICKS; tick++) {
    const previousX = projectile.x;
    const previousY = projectile.y;
    stepProjectile(projectile, state.wind, gravity);
    const hit = sweepCollide(
      projectile,
      previousX,
      previousY,
      state.terrain,
      state.tanks,
      state.walls ?? 'open',
    );
    const candidate = hit.type === 'none'
      ? { x: projectile.x, y: projectile.y }
      : hit.type === 'oob'
        ? clampOpenBoundary(projectile, previousX, previousY)
        : { x: hit.x, y: hit.y };

    // Connect the authored barrel along the exact zero-time launch tangent, but
    // only after the first authoritative sweep proves that point is reachable.
    // An immediate contact therefore ends the guide at the hit instead of
    // drawing past it and doubling back.
    if (
      tick === 0
      && tangent
      && (
        hit.type === 'none'
        || Math.hypot(candidate.x - tip.x, candidate.y - tip.y) > tangentLength
      )
    ) {
      points.push(tangent);
      traveled = tangentLength;
    }

    const last = points.at(-1)!;
    const segmentLength = Math.hypot(candidate.x - last.x, candidate.y - last.y);
    const remaining = maxLength - traveled;

    if (segmentLength >= remaining) {
      const fraction = segmentLength > 0 ? clamp(remaining / segmentLength, 0, 1) : 0;
      points.push({
        x: last.x + (candidate.x - last.x) * fraction,
        y: last.y + (candidate.y - last.y) * fraction,
      });
      return points;
    }

    points.push(candidate);
    traveled += segmentLength;
    if (hit.type !== 'none') return points;
  }

  return points;
}

/** Put an open-wall exit on the final drawable boundary rather than off-canvas. */
function clampOpenBoundary(
  point: AimGuidePoint,
  previousX: number,
  previousY: number,
): AimGuidePoint {
  if (point.x >= 0 && point.x < CANVAS_WIDTH) {
    return {
      x: point.x,
      y: clamp(point.y, 0, CANVAS_HEIGHT - 0.01),
    };
  }

  const boundaryX = point.x < 0 ? 0 : CANVAS_WIDTH - 0.01;
  const deltaX = point.x - previousX;
  const fraction = deltaX !== 0
    ? clamp((boundaryX - previousX) / deltaX, 0, 1)
    : 0;
  return {
    x: boundaryX,
    y: clamp(
      previousY + (point.y - previousY) * fraction,
      0,
      CANVAS_HEIGHT - 0.01,
    ),
  };
}

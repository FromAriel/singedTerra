import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  surfaceAt,
} from '@shared/engine/Terrain';

/** Compact contact cue for a shell just above the ground. */
export const GROUND_SHADOW_MIN_RADIUS_X = 9;
export const GROUND_SHADOW_MIN_RADIUS_Y = 3;
/** Soft upper bound for very high projectiles. */
export const GROUND_SHADOW_MAX_RADIUS_X = 30;
export const GROUND_SHADOW_MAX_RADIUS_Y = 7;
/** Near-ground and maximum-altitude opacity bounds. */
export const GROUND_SHADOW_MAX_ALPHA = 0.52;
export const GROUND_SHADOW_MIN_ALPHA = 0.2;
/** Altitude at which widening/fading reaches its bounded maximum. */
export const GROUND_SHADOW_SCALE_ALTITUDE = 320;

export interface ProjectileGroundPoint {
  x: number;
  y: number;
}

export interface ProjectileGroundShadow {
  x: number;
  groundY: number;
  altitude: number;
  radiusX: number;
  radiusY: number;
  alpha: number;
}

/**
 * Project a live shell's current x-position onto the first solid terrain pixel.
 *
 * This is a present-position visual cue, not a future impact prediction. It reads
 * the live bitmap and returns finite bounded geometry without retaining or mutating
 * any state.
 */
export function getProjectileGroundShadow(
  projectile: Readonly<ProjectileGroundPoint>,
  terrain: Uint8Array,
): ProjectileGroundShadow | null {
  const { x, y } = projectile;
  if (
    !Number.isFinite(x)
    || !Number.isFinite(y)
    || x < 0
    || x >= CANVAS_WIDTH
    || !(terrain instanceof Uint8Array)
    || terrain.length !== CANVAS_WIDTH * CANVAS_HEIGHT
  ) {
    return null;
  }

  const groundY = surfaceAt(terrain, x);
  if (groundY >= CANVAS_HEIGHT) return null;

  const altitude = groundY - y;
  if (!Number.isFinite(altitude) || altitude <= 0) return null;

  const scale = Math.min(altitude / GROUND_SHADOW_SCALE_ALTITUDE, 1);
  const radiusX = GROUND_SHADOW_MIN_RADIUS_X
    + (GROUND_SHADOW_MAX_RADIUS_X - GROUND_SHADOW_MIN_RADIUS_X) * scale;
  const radiusY = GROUND_SHADOW_MIN_RADIUS_Y
    + (GROUND_SHADOW_MAX_RADIUS_Y - GROUND_SHADOW_MIN_RADIUS_Y) * scale;
  const alpha = GROUND_SHADOW_MAX_ALPHA
    - (GROUND_SHADOW_MAX_ALPHA - GROUND_SHADOW_MIN_ALPHA) * scale;

  return { x, groundY, altitude, radiusX, radiusY, alpha };
}

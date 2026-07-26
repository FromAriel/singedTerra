/** Largest radius that keeps the existing shake without adding directional recoil. */
export const IMPACT_KICK_THRESHOLD = 24;

/** Maximum world translation in logical canvas pixels. */
export const IMPACT_KICK_MAX = 8;

/** Directional recoil gained per radius pixel above the threshold. */
const IMPACT_KICK_GAIN = 0.16;

export interface ImpactKick {
  x: number;
  y: number;
}

/**
 * Derive a bounded render-only camera recoil from one explosion.
 *
 * The vector points from the impact toward the viewport center. Translating the
 * world by that vector makes the camera feel pushed away from the blast without
 * changing any engine, replay, or network state.
 */
export function impactKick(
  cx: number,
  cy: number,
  radius: number,
  width: number,
  height: number,
): ImpactKick {
  if (
    !Number.isFinite(cx)
    || !Number.isFinite(cy)
    || !Number.isFinite(radius)
    || !Number.isFinite(width)
    || !Number.isFinite(height)
    || width <= 0
    || height <= 0
    || radius <= IMPACT_KICK_THRESHOLD
  ) {
    return { x: 0, y: 0 };
  }

  const dx = width / 2 - cx;
  const dy = height / 2 - cy;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return { x: 0, y: 0 };

  const magnitude = Math.min(
    IMPACT_KICK_MAX,
    (radius - IMPACT_KICK_THRESHOLD) * IMPACT_KICK_GAIN,
  );
  return {
    x: dx / distance * magnitude,
    y: dy / distance * magnitude,
  };
}

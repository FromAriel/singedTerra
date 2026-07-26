/**
 * Presentation-only debris motion. This state never enters GameState or replay.
 */
export interface DebrisMotion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  landed: boolean;
}

/** Read-only view of the current authoritative terrain bitmap. */
export interface TerrainField {
  bitmap: Uint8Array;
  width: number;
  height: number;
}

function usableTerrain(field: TerrainField): boolean {
  return Number.isInteger(field.width)
    && Number.isInteger(field.height)
    && field.width > 0
    && field.height > 0
    && field.width * field.height <= field.bitmap.length;
}

function lowerEdgeTouchesTerrain(
  field: TerrainField,
  x: number,
  bottom: number,
  halfSize: number,
): boolean {
  const iy = Math.floor(bottom);
  if (iy < 0 || iy >= field.height) return false;
  const firstX = Math.max(0, Math.floor(x - halfSize));
  const lastX = Math.min(field.width - 1, Math.floor(x + halfSize));
  for (let ix = firstX; ix <= lastX; ix++) {
    if (field.bitmap[iy * field.width + ix] !== 0) return true;
  }
  return false;
}

interface TimeInterval {
  enter: number;
  exit: number;
}

function axisInterval(
  start: number,
  delta: number,
  min: number,
  max: number,
): TimeInterval {
  // Candidate enumeration already guarantees overlap on a stationary axis.
  if (delta === 0) return { enter: 0, exit: 1 };
  const first = (min - start) / delta;
  const second = (max - start) / delta;
  return { enter: Math.min(first, second), exit: Math.max(first, second) };
}

/**
 * Earliest time in [0,1] at which the moving horizontal lower edge overlaps a
 * solid terrain pixel. This is a swept-volume query, not point sampling: each
 * candidate cell is expanded horizontally by the chunk half-width and intersected
 * with the center path on both axes.
 */
function earliestTerrainHit(
  field: TerrainField,
  debris: DebrisMotion,
  vy: number,
  halfSize: number,
): number | null {
  const startBottom = debris.y + halfSize;
  const endBottom = startBottom + vy;
  const firstX = Math.max(
    0,
    Math.floor(Math.min(debris.x - halfSize, debris.x + debris.vx - halfSize)),
  );
  const lastX = Math.min(
    field.width - 1,
    Math.floor(Math.max(debris.x + halfSize, debris.x + debris.vx + halfSize)),
  );
  const firstY = Math.max(0, Math.floor(Math.min(startBottom, endBottom)));
  const lastY = Math.min(field.height - 1, Math.floor(Math.max(startBottom, endBottom)));
  let earliest = Number.POSITIVE_INFINITY;

  for (let iy = firstY; iy <= lastY; iy++) {
    for (let ix = firstX; ix <= lastX; ix++) {
      if (field.bitmap[iy * field.width + ix] === 0) continue;
      const xTimes = axisInterval(
        debris.x,
        debris.vx,
        ix - halfSize,
        ix + 1 + halfSize,
      );
      const yTimes = axisInterval(startBottom, vy, iy, iy + 1);
      const enter = Math.max(0, xTimes.enter, yTimes.enter);
      const exit = Math.min(1, xTimes.exit, yTimes.exit);
      if (enter <= exit) earliest = Math.min(earliest, enter);
    }
  }

  return Number.isFinite(earliest) ? earliest : null;
}

/**
 * Advance one decorative debris chunk by one rendered frame.
 *
 * Falling motion is swept in <=1 px samples and probes the chunk's left, center,
 * and right lower edge. A terrain hit returns the last clear position, avoiding
 * both center-point embedding and tunneling by fast ejecta. Landed chunks retain
 * no gameplay mass: if their visual support is deformed away, they simply resume
 * falling on the next presentation frame.
 */
export function advanceDebris(
  debris: DebrisMotion,
  terrain: TerrainField,
  gravity: number,
): DebrisMotion {
  const halfSize = Math.max(0, debris.size / 2);
  const terrainUsable = usableTerrain(terrain);

  if (debris.landed) {
    const supported = terrainUsable
      && lowerEdgeTouchesTerrain(terrain, debris.x, debris.y + halfSize + 1, halfSize);
    if (supported) return { ...debris };
  }

  const vy = debris.vy + gravity;
  const nextX = debris.x + debris.vx;
  const nextY = debris.y + vy;
  const nextRot = debris.rot + debris.vr;

  // Upward ejecta must be allowed to emerge from the crater/wreck that spawned it.
  if (vy <= 0 || !terrainUsable) {
    return { ...debris, x: nextX, y: nextY, vy, rot: nextRot, landed: false };
  }

  const hitTime = earliestTerrainHit(terrain, debris, vy, halfSize);
  if (hitTime !== null) {
    // Stay infinitesimally on the clear side of the first solid pixel boundary.
    const lastClear = Math.max(0, hitTime - 1e-4);
    return {
      ...debris,
      x: debris.x + debris.vx * lastClear,
      y: debris.y + vy * lastClear,
      vx: 0,
      vy: 0,
      vr: 0,
      landed: true,
    };
  }

  return { ...debris, x: nextX, y: nextY, vy, rot: nextRot, landed: false };
}

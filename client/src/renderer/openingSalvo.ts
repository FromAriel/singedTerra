import type { GameState, TankState } from '@shared/types/GameState';
import {
  launchVelocity,
  stepProjectile,
  sweepCollide,
} from '@shared/engine/Physics';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import { getWeapon } from '@shared/engine/WeaponSystem';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import { ACCENT } from '../ui/theme';

/** Hard simulation bound shared with the AI's ballistic probe. */
export const OPENING_SOLUTION_MAX_TICKS = 1600;
/** Retain one point every four fixed physics steps: smooth at game scale, bounded. */
export const OPENING_SOLUTION_SAMPLE_INTERVAL = 4;
/** Distinct collision-cue cyan; used by the browser rendering oracle. */
export const OPENING_SOLUTION_COLOR = ACCENT.solution;

const IMPACT_BRACKET_RADIUS = 10;
const IMPACT_BRACKET_ARM = 7;
const IMPACT_BRACKET_THICKNESS = 2;
const PATH_PIP_SIZE = 3;
const LABEL_MARGIN = 8;
const LABEL_OFFSET_Y = 18;
const LABEL_FONT = '600 11px "IBM Plex Mono", monospace';
const LABEL_TEXT = 'OPENING SOLUTION';
const LABEL_PAD_X = 5;
const LABEL_HEIGHT = 17;

export interface TrajectoryPoint {
  readonly x: number;
  readonly y: number;
}

export type OpeningSalvoImpact =
  | { readonly type: 'ground'; readonly x: number; readonly y: number }
  | {
      readonly type: 'tank';
      readonly tankId: string;
      readonly x: number;
      readonly y: number;
    };

export interface OpeningSalvoSolution {
  readonly points: readonly TrajectoryPoint[];
  readonly impact: OpeningSalvoImpact | null;
}

export type AimGuideMode = 'none' | 'opening' | 'launch';

function solutionCacheKey(
  state: Readonly<GameState>,
  tank: Readonly<TankState>,
  gravity: number,
): string {
  const collisionGeometry = state.tanks
    .map((candidate) => [
      candidate.id,
      candidate.alive ? 1 : 0,
      candidate.x,
      candidate.y,
    ].join(','))
    .join(';');
  return [
    state.phase,
    state.turn,
    state.activePlayerId,
    state.wind,
    state.terrainVersion,
    tank.id,
    tank.x,
    tank.y,
    tank.angle,
    tank.power,
    tank.selectedWeapon,
    gravity,
    collisionGeometry,
  ].join('|');
}

/**
 * Renderer-local memo for the static PLAYER_TURN solution. Opening wind ribbons
 * can keep the Canvas animating for 48 frames; this prevents those cosmetic
 * frames from re-running swept collision when no trajectory input changed.
 */
export class OpeningSalvoCache {
  private key: string | null = null;
  private value: OpeningSalvoSolution | null = null;

  get(
    state: Readonly<GameState>,
    tank: Readonly<TankState>,
    gravity: number,
  ): OpeningSalvoSolution | null {
    const key = solutionCacheKey(state, tank, gravity);
    if (key !== this.key) {
      this.key = key;
      this.value = traceOpeningSalvo(state, tank, gravity);
    }
    return this.value;
  }

  clear(): void {
    this.key = null;
    this.value = null;
  }
}

function finiteTank(tank: Readonly<TankState>): boolean {
  return Number.isFinite(tank.x)
    && Number.isFinite(tank.y)
    && Number.isFinite(tank.angle)
    && Number.isFinite(tank.power);
}

/**
 * Decide which local aim cue is honest for this frame.
 *
 * The full collision solution is deliberately a match-opening teaching aid,
 * not permanent aim assistance. Weapons whose payload changes in flight fall
 * back to the short launch vector because tracing only their carrier would imply
 * a landing result they do not actually produce.
 */
export function getAimGuideMode(
  state: Readonly<GameState>,
  tank: Readonly<TankState>,
  localControls: boolean,
  guideEnabled: boolean,
): AimGuideMode {
  if (
    !localControls
    || !guideEnabled
    || state.phase !== 'PLAYER_TURN'
    || !tank.alive
  ) {
    return 'none';
  }

  const behavior = getWeapon(tank.selectedWeapon).behavior;
  const directFlight = !behavior?.shield && !behavior?.airburst && !behavior?.bounce;
  const openingRotation = Number.isInteger(state.turn)
    && state.turn >= 0
    && state.turn < state.tanks.length;
  return directFlight && openingRotation ? 'opening' : 'launch';
}

/**
 * Trace one read-only ballistic solution with the exact fixed-step physics and
 * swept collision used by the engine. The caller's state, tank, terrain, and
 * tank collection are never mutated.
 */
export function traceOpeningSalvo(
  state: Pick<GameState, 'wind' | 'terrain' | 'tanks'>,
  tank: Readonly<TankState>,
  gravity: number,
): OpeningSalvoSolution | null {
  if (
    !Number.isFinite(state.wind)
    || !Number.isFinite(gravity)
    || gravity <= 0
    || !finiteTank(tank)
    || state.terrain.length !== CANVAS_WIDTH * CANVAS_HEIGHT
  ) {
    return null;
  }

  const velocity = launchVelocity(tank.angle, tank.power);
  if (!Number.isFinite(velocity.vx) || !Number.isFinite(velocity.vy)) return null;

  const tip = barrelTip(tank, BARREL_LENGTH);
  const projectile = {
    x: tip.x,
    y: tip.y,
    vx: velocity.vx,
    vy: velocity.vy,
    weaponType: tank.selectedWeapon,
    age: 0,
    // Presentation traces only the direct-flight shell. These fields satisfy the
    // canonical projectile shape but are never advanced by secondary behavior.
    hasSplit: true,
    bounces: 0,
  };
  const points: TrajectoryPoint[] = [{ x: tip.x, y: tip.y }];

  for (let tick = 1; tick <= OPENING_SOLUTION_MAX_TICKS; tick++) {
    const previousX = projectile.x;
    const previousY = projectile.y;
    stepProjectile(projectile, state.wind, gravity);
    const collision = sweepCollide(
      projectile,
      previousX,
      previousY,
      state.terrain,
      state.tanks,
    );

    if (collision.type === 'ground' || collision.type === 'tank') {
      const impact: OpeningSalvoImpact = collision.type === 'tank'
        ? {
            type: 'tank',
            tankId: collision.tankId,
            x: projectile.x,
            y: projectile.y,
          }
        : { type: 'ground', x: projectile.x, y: projectile.y };
      const last = points[points.length - 1];
      if (last.x !== impact.x || last.y !== impact.y) {
        points.push({ x: impact.x, y: impact.y });
      }
      return { points, impact };
    }
    if (collision.type === 'oob') return { points, impact: null };
    if (tick % OPENING_SOLUTION_SAMPLE_INTERVAL === 0) {
      points.push({ x: projectile.x, y: projectile.y });
    }
  }

  return { points, impact: null };
}

/**
 * Paint a static targeting projection. Rectangular pips and bracket arms retain
 * crisp exact-color centers under Canvas anti-aliasing, while a restrained
 * additive glow helps the path read against both sky and terrain.
 */
export function drawOpeningSalvoSolution(
  ctx: CanvasRenderingContext2D,
  solution: Readonly<OpeningSalvoSolution>,
): void {
  if (solution.points.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = ACCENT.gold;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.moveTo(solution.points[0].x, solution.points[0].y);
  for (let index = 1; index < solution.points.length; index++) {
    ctx.lineTo(solution.points[index].x, solution.points[index].y);
  }
  ctx.stroke();
  ctx.lineWidth = 1.25;
  ctx.globalAlpha = 0.42;
  ctx.stroke();

  ctx.fillStyle = ACCENT.gold;
  for (let index = 0; index < solution.points.length; index++) {
    const point = solution.points[index];
    const progress = solution.points.length <= 1
      ? 1
      : index / (solution.points.length - 1);
    ctx.globalAlpha = 0.22 + progress * 0.5;
    ctx.fillRect(
      Math.round(point.x - PATH_PIP_SIZE / 2),
      Math.round(point.y - PATH_PIP_SIZE / 2),
      PATH_PIP_SIZE,
      PATH_PIP_SIZE,
    );
  }

  const impact = solution.impact;
  if (!impact) {
    ctx.restore();
    return;
  }

  const left = Math.round(impact.x - IMPACT_BRACKET_RADIUS);
  const right = Math.round(impact.x + IMPACT_BRACKET_RADIUS);
  const top = Math.round(impact.y - IMPACT_BRACKET_RADIUS);
  const bottom = Math.round(impact.y + IMPACT_BRACKET_RADIUS);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = OPENING_SOLUTION_COLOR;

  // Four L-shaped corners: eight crisp rectangles, no retained path state.
  ctx.fillRect(left, top, IMPACT_BRACKET_ARM, IMPACT_BRACKET_THICKNESS);
  ctx.fillRect(left, top, IMPACT_BRACKET_THICKNESS, IMPACT_BRACKET_ARM);
  ctx.fillRect(right - IMPACT_BRACKET_ARM, top, IMPACT_BRACKET_ARM, IMPACT_BRACKET_THICKNESS);
  ctx.fillRect(right - IMPACT_BRACKET_THICKNESS, top, IMPACT_BRACKET_THICKNESS, IMPACT_BRACKET_ARM);
  ctx.fillRect(left, bottom - IMPACT_BRACKET_THICKNESS, IMPACT_BRACKET_ARM, IMPACT_BRACKET_THICKNESS);
  ctx.fillRect(left, bottom - IMPACT_BRACKET_ARM, IMPACT_BRACKET_THICKNESS, IMPACT_BRACKET_ARM);
  ctx.fillRect(
    right - IMPACT_BRACKET_ARM,
    bottom - IMPACT_BRACKET_THICKNESS,
    IMPACT_BRACKET_ARM,
    IMPACT_BRACKET_THICKNESS,
  );
  ctx.fillRect(
    right - IMPACT_BRACKET_THICKNESS,
    bottom - IMPACT_BRACKET_ARM,
    IMPACT_BRACKET_THICKNESS,
    IMPACT_BRACKET_ARM,
  );

  ctx.globalAlpha = 0.88;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const labelWidth = ctx.measureText(LABEL_TEXT).width;
  const labelX = Math.max(
    LABEL_MARGIN,
    Math.min(CANVAS_WIDTH - labelWidth - LABEL_MARGIN, impact.x + IMPACT_BRACKET_RADIUS + 5),
  );
  const labelY = Math.max(
    LABEL_MARGIN,
    Math.min(CANVAS_HEIGHT - LABEL_MARGIN, impact.y - LABEL_OFFSET_Y),
  );
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = 'rgba(11, 8, 24, 0.92)';
  ctx.fillRect(
    Math.round(labelX - LABEL_PAD_X),
    Math.round(labelY - LABEL_HEIGHT / 2),
    Math.ceil(labelWidth + LABEL_PAD_X * 2),
    LABEL_HEIGHT,
  );
  ctx.globalAlpha = 1;
  ctx.fillStyle = OPENING_SOLUTION_COLOR;
  ctx.fillRect(
    Math.round(labelX - LABEL_PAD_X),
    Math.round(labelY - LABEL_HEIGHT / 2),
    Math.ceil(labelWidth + LABEL_PAD_X * 2),
    1,
  );
  ctx.fillText(LABEL_TEXT, labelX, labelY);
  ctx.restore();
}

import { describe, expect, it, vi } from 'vitest';
import type { GameState, TankState } from '@shared/types/GameState';
import { launchVelocity, stepProjectile } from '@shared/engine/Physics';
import { BARREL_LENGTH, barrelTip } from '@shared/engine/Tank';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import {
  OPENING_SOLUTION_COLOR,
  OPENING_SOLUTION_MAX_TICKS,
  OPENING_SOLUTION_SAMPLE_INTERVAL,
  OpeningSalvoCache,
  drawOpeningSalvoSolution,
  getAimGuideMode,
  traceOpeningSalvo,
} from './openingSalvo';
import { Renderer } from './Renderer';

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

function flatTerrain(surfaceY = 420): Uint8Array {
  const terrain = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
  for (let y = surfaceY; y < CANVAS_HEIGHT; y++) {
    terrain.fill(1, y * CANVAS_WIDTH, (y + 1) * CANVAS_WIDTH);
  }
  return terrain;
}

function state(
  me = tank(),
  overrides: Partial<GameState> = {},
): GameState {
  return {
    phase: 'PLAYER_TURN',
    turn: 0,
    round: 1,
    activePlayerId: me.id,
    wind: 0,
    tanks: [me, tank({ id: 'p2', playerName: 'P2', x: 900, color: '#3b82f6' })],
    terrain: flatTerrain(),
    terrainVersion: 0,
    projectiles: [],
    projectile: null,
    explosions: [],
    lastExplosion: null,
    fire: [],
    ...overrides,
  } as GameState;
}

describe('opening salvo trajectory', () => {
  it('samples the real fixed-step launch path and includes the swept collision', () => {
    const me = tank();
    const frame = state(me);
    const solution = traceOpeningSalvo(frame, me, 0.15);

    expect(solution).not.toBeNull();
    const tip = barrelTip(me, BARREL_LENGTH);
    expect(solution!.points[0]).toEqual(tip);

    const velocity = launchVelocity(me.angle, me.power);
    const projectile = {
      ...tip,
      vx: velocity.vx,
      vy: velocity.vy,
      weaponType: me.selectedWeapon,
      age: 0,
      hasSplit: true,
      bounces: 0,
    };
    for (let tick = 0; tick < OPENING_SOLUTION_SAMPLE_INTERVAL; tick++) {
      stepProjectile(projectile, frame.wind, 0.15);
    }
    expect(solution!.points[1].x).toBeCloseTo(projectile.x, 8);
    expect(solution!.points[1].y).toBeCloseTo(projectile.y, 8);
    expect(solution!.impact?.type).toBe('ground');
    expect(solution!.points.at(-1)).toEqual({
      x: solution!.impact!.x,
      y: solution!.impact!.y,
    });
  });

  it('uses room gravity and wind, and detects a living tank before terrain', () => {
    const me = tank({ angle: 15, power: 35 });
    const base = state(me, { terrain: new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT) });
    const calm = traceOpeningSalvo(base, me, 0.15)!;
    const windy = traceOpeningSalvo({ ...base, wind: 8 }, me, 0.15)!;
    const heavy = traceOpeningSalvo(base, me, 0.3)!;

    expect(windy.points[3].x).toBeGreaterThan(calm.points[3].x);
    expect(heavy.points[3].y).toBeGreaterThan(calm.points[3].y);

    const intercept = calm.points[2];
    const target = tank({
      id: 'p2',
      playerName: 'P2',
      x: intercept.x,
      y: intercept.y + 10,
      color: '#3b82f6',
    });
    const hit = traceOpeningSalvo({ ...base, tanks: [me, target] }, me, 0.15)!;
    expect(hit.impact).toMatchObject({ type: 'tank', tankId: 'p2' });
  });

  it('bounds misses, rejects non-finite inputs, and never mutates caller state', () => {
    const me = tank({ x: 1100, angle: 0, power: 100 });
    const frame = state(me, {
      wind: 0,
      terrain: new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT),
      tanks: [me],
    });
    const tankBefore = { ...me };
    const terrainBefore = frame.terrain.slice();
    const miss = traceOpeningSalvo(frame, me, 0.15)!;

    expect(miss.impact).toBeNull();
    expect(miss.points.length)
      .toBeLessThanOrEqual(Math.ceil(OPENING_SOLUTION_MAX_TICKS / OPENING_SOLUTION_SAMPLE_INTERVAL) + 2);
    expect(me).toEqual(tankBefore);
    expect(frame.terrain).toEqual(terrainBefore);
    expect(traceOpeningSalvo({ ...frame, wind: Number.NaN }, me, 0.15)).toBeNull();
    expect(traceOpeningSalvo(frame, { ...me, power: Number.POSITIVE_INFINITY }, 0.15))
      .toBeNull();
    expect(traceOpeningSalvo(frame, me, Number.NaN)).toBeNull();
  });

  it('reuses a static solution and invalidates every trajectory-changing input', () => {
    const me = tank();
    const frame = state(me);
    const cache = new OpeningSalvoCache();
    const first = cache.get(frame, me, 0.15);

    expect(cache.get(frame, me, 0.15)).toBe(first);
    expect(cache.get({ ...frame, wind: 1 }, me, 0.15)).not.toBe(first);

    const aimed = cache.get(frame, { ...me, angle: me.angle + 1 }, 0.15);
    expect(aimed).not.toBe(first);
    expect(cache.get({ ...frame, terrainVersion: 1 }, me, 0.15)).not.toBe(aimed);
    expect(cache.get(
      {
        ...frame,
        tanks: [me, { ...frame.tanks[1], x: frame.tanks[1].x + 1 }],
      },
      me,
      0.15,
    )).not.toBe(aimed);
    expect(cache.get(frame, me, 0.2)).not.toBe(first);

    cache.clear();
    expect(cache.get(frame, me, 0.15)).not.toBe(first);
  });
});

describe('opening salvo eligibility', () => {
  it('shows one local direct-flight solution in the match opening, then falls back', () => {
    const me = tank();
    const opening = state(me);

    expect(getAimGuideMode(opening, me, true, true)).toBe('opening');
    expect(getAimGuideMode({ ...opening, turn: opening.tanks.length }, me, true, true))
      .toBe('launch');
    expect(getAimGuideMode(opening, { ...me, selectedWeapon: 'cluster_bomb' }, true, true))
      .toBe('launch');
    expect(getAimGuideMode(opening, { ...me, selectedWeapon: 'bouncing_betty' }, true, true))
      .toBe('launch');
    expect(getAimGuideMode(opening, { ...me, selectedWeapon: 'shield' }, true, true))
      .toBe('launch');
    expect(getAimGuideMode(opening, me, false, true)).toBe('none');
    expect(getAimGuideMode(opening, me, true, false)).toBe('none');
    expect(getAimGuideMode({ ...opening, phase: 'FIRING' }, me, true, true)).toBe('none');
  });
});

describe('aim-guide invalid-input safety', () => {
  it.each([
    ['opening trace', 0],
    ['launch hint', 2],
  ])('fails closed for an invalid %s', (_name, turn) => {
    const fillRect = vi.fn();
    const save = vi.fn();
    const renderer = Object.assign(Object.create(Renderer.prototype), {
      ctx: {
        save,
        restore: vi.fn(),
        fillRect,
      },
      showAimGuide: true,
      aimGuideEnabled: true,
      aimGuideGravity: 0.15,
      openingSalvoCache: {
        get: vi.fn(() => null),
      },
    }) as {
      drawAimGuide(state: GameState): void;
    };
    const me = tank({ power: Number.POSITIVE_INFINITY });

    renderer.drawAimGuide(state(me, { turn }));

    expect(fillRect).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});

describe('opening salvo drawing', () => {
  it('draws a bounded gold path and a distinct labeled collision bracket', () => {
    const fillRect = vi.fn();
    const fillText = vi.fn();
    const stroke = vi.fn();
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      stroke,
      fillRect,
      fillText,
      measureText: vi.fn(() => ({ width: 72 })),
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      font: '',
      textAlign: 'start',
      textBaseline: 'alphabetic',
    } as unknown as CanvasRenderingContext2D;

    drawOpeningSalvoSolution(ctx, {
      points: [
        { x: 100, y: 300 },
        { x: 140, y: 260 },
        { x: 180, y: 280 },
        { x: 220, y: 340 },
      ],
      impact: { type: 'ground', x: 220, y: 340 },
    });

    expect(fillRect.mock.calls.length).toBeGreaterThanOrEqual(8);
    expect(stroke).toHaveBeenCalledTimes(2);
    expect(fillText).toHaveBeenCalledWith('OPENING SOLUTION', expect.any(Number), expect.any(Number));
    expect(fillText.mock.calls[0][0]).toBe('OPENING SOLUTION');
    expect(ctx.fillStyle).toBe(OPENING_SOLUTION_COLOR);
    expect(ctx.globalCompositeOperation).toBe('source-over');
  });
});

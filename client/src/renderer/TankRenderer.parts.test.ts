import { describe, expect, it, vi } from 'vitest';
import type { TankState } from '@shared/types/GameState';
import type { TankChassisPainter } from './TankChassisArt';
import type {
  TankPartArtState,
  TankPartPainter,
} from './TankPartArt';
import { TankRenderer } from './TankRenderer';

function tank(): TankState {
  return {
    id: 'p1',
    x: 240,
    y: 410,
    angle: 42,
    color: '#d65cff',
    health: 100,
    alive: true,
  } as TankState;
}

function chassis(settled = true): {
  painter: TankChassisPainter;
  draw: ReturnType<typeof vi.fn>;
} {
  const draw = vi.fn(() => true);
  return {
    painter: { isSettled: settled, draw, onReady: vi.fn(() => vi.fn()) },
    draw,
  };
}

function parts(
  result: boolean,
  state: TankPartArtState = result ? 'ready' : 'loading',
  settled = result,
): {
  painter: TankPartPainter;
  drawStatic: ReturnType<typeof vi.fn>;
  drawBarrel: ReturnType<typeof vi.fn>;
} {
  const drawStatic = vi.fn(() => result);
  const drawBarrel = vi.fn(() => result);
  return {
    painter: {
      state,
      isSettled: settled,
      onReady: vi.fn(() => vi.fn()),
      drawStatic,
      drawBarrel,
    },
    drawStatic,
    drawBarrel,
  };
}

function context(): {
  ctx: CanvasRenderingContext2D;
  lineTo: ReturnType<typeof vi.fn>;
} {
  const lineTo = vi.fn();
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo,
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, lineTo };
}

describe('TankRenderer modular authored assembly', () => {
  it('uses all authored parts without painting either legacy fallback', () => {
    const legacy = chassis();
    const modular = parts(true);
    const harness = context();
    const subject = tank();

    new TankRenderer(legacy.painter, modular.painter)
      .draw(harness.ctx, subject, false);

    expect(modular.drawStatic).toHaveBeenCalledWith(harness.ctx, subject);
    expect(modular.drawBarrel).toHaveBeenCalledWith(harness.ctx, subject);
    expect(legacy.draw).not.toHaveBeenCalled();
    expect(harness.lineTo).not.toHaveBeenCalled();
  });

  it('keeps the authored chassis and procedural barrel as exact fallback', () => {
    const legacy = chassis();
    const modular = parts(false, 'failed', true);
    const harness = context();

    new TankRenderer(legacy.painter, modular.painter)
      .draw(harness.ctx, tank(), false);

    expect(legacy.draw).toHaveBeenCalledOnce();
    expect(harness.lineTo).toHaveBeenCalled();
  });

  it('settles on modular success or on a settled fallback after modular failure', () => {
    expect(new TankRenderer(
      chassis(false).painter,
      parts(true, 'ready', true).painter,
    ).isChassisArtSettled).toBe(true);
    expect(new TankRenderer(
      chassis(false).painter,
      parts(false, 'loading', false).painter,
    ).isChassisArtSettled).toBe(false);
    expect(new TankRenderer(
      chassis(true).painter,
      parts(false, 'failed', true).painter,
    ).isChassisArtSettled).toBe(true);
  });

  it('forwards either authored painter readiness as one render invalidation', () => {
    let chassisReady: (() => void) | undefined;
    let partsReady: (() => void) | undefined;
    const legacy = chassis(false).painter;
    const modular = parts(false, 'timed_out', true).painter;
    legacy.onReady = vi.fn((listener) => {
      chassisReady = listener;
      return vi.fn();
    });
    modular.onReady = vi.fn((listener) => {
      partsReady = listener;
      return vi.fn();
    });
    const invalidate = vi.fn();

    new TankRenderer(legacy, modular, invalidate);
    chassisReady?.();
    partsReady?.();

    expect(invalidate).toHaveBeenCalledTimes(2);
  });
});

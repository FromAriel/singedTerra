import { describe, expect, it, vi } from 'vitest';
import {
  TANK_CHASSIS_DRAW_HEIGHT,
  TANK_CHASSIS_DRAW_WIDTH,
  TANK_CHASSIS_LOAD_TIMEOUT_MS,
  TANK_CHASSIS_SOURCE_HEIGHT,
  TANK_CHASSIS_SOURCE_WIDTH,
  TankChassisArt,
  type TankChassisCanvasFactory,
  type TankChassisImageFactory,
} from './TankChassisArt';

interface ControlledImage {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

function controlledImage(): ControlledImage {
  return {
    src: '',
    naturalWidth: 0,
    naturalHeight: 0,
    onload: null,
    onerror: null,
  };
}

interface TintCanvasHarness {
  factory: TankChassisCanvasFactory;
  canvases: HTMLCanvasElement[];
  drawImage: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  compositeOperations: string[];
}

function tintCanvasHarness(): TintCanvasHarness {
  const canvases: HTMLCanvasElement[] = [];
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  const compositeOperations: string[] = [];
  const factory: TankChassisCanvasFactory = () => {
    const context = {
      drawImage,
      fillRect,
      set globalCompositeOperation(value: string) {
        compositeOperations.push(value);
      },
      set fillStyle(_value: string) {},
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
    } as unknown as HTMLCanvasElement;
    canvases.push(canvas);
    return canvas;
  };
  return {
    factory,
    canvases,
    drawImage,
    fillRect,
    compositeOperations,
  };
}

function settleValid(image: ControlledImage): void {
  image.naturalWidth = TANK_CHASSIS_SOURCE_WIDTH;
  image.naturalHeight = TANK_CHASSIS_SOURCE_HEIGHT;
  image.onload?.();
}

describe('TankChassisArt', () => {
  it('loads one base-aware image and leaves the procedural fallback active', () => {
    const image = controlledImage();
    let allocations = 0;
    let handlersAttachedBeforeSrc = false;
    let assignedSrc = '';
    Object.defineProperty(image, 'src', {
      get: () => assignedSrc,
      set: (value: string) => {
        assignedSrc = value;
        handlersAttachedBeforeSrc = (
          typeof image.onload === 'function'
          && typeof image.onerror === 'function'
        );
      },
    });
    const createImage: TankChassisImageFactory = () => {
      allocations++;
      return image as unknown as HTMLImageElement;
    };
    const harness = tintCanvasHarness();
    const art = new TankChassisArt(
      createImage,
      harness.factory,
      '/singedTerra/',
    );
    const targetDrawImage = vi.fn();

    expect(allocations).toBe(1);
    expect(handlersAttachedBeforeSrc).toBe(true);
    expect(assignedSrc).toBe('/singedTerra/art/tank-chassis.webp');
    expect(art.state).toBe('loading');
    expect(art.isSettled).toBe(false);
    expect(art.draw(
      { drawImage: targetDrawImage } as unknown as CanvasRenderingContext2D,
      120,
      300,
      '#e53935',
    )).toBe(false);
    expect(harness.canvases).toHaveLength(0);
    expect(targetDrawImage).not.toHaveBeenCalled();
  });

  it('caches one luminance-preserving tint canvas per player color', () => {
    const image = controlledImage();
    const harness = tintCanvasHarness();
    const art = new TankChassisArt(
      () => image as unknown as HTMLImageElement,
      harness.factory,
      '/',
    );
    const targetDrawImage = vi.fn();
    const target = {
      drawImage: targetDrawImage,
    } as unknown as CanvasRenderingContext2D;

    settleValid(image);

    expect(art.state).toBe('ready');
    expect(art.isSettled).toBe(false);
    expect(harness.canvases).toHaveLength(0);

    expect(art.draw(target, 120, 300, '#e53935')).toBe(true);
    expect(art.isSettled).toBe(true);
    expect(harness.canvases).toHaveLength(1);
    expect(harness.canvases[0]!.width).toBe(TANK_CHASSIS_DRAW_WIDTH);
    expect(harness.canvases[0]!.height).toBe(TANK_CHASSIS_DRAW_HEIGHT);
    expect(harness.drawImage).toHaveBeenCalledTimes(2);
    expect(harness.drawImage).toHaveBeenNthCalledWith(
      1,
      image,
      0,
      0,
      TANK_CHASSIS_SOURCE_WIDTH,
      TANK_CHASSIS_SOURCE_HEIGHT,
      0,
      0,
      TANK_CHASSIS_DRAW_WIDTH,
      TANK_CHASSIS_DRAW_HEIGHT,
    );
    expect(harness.fillRect).toHaveBeenCalledWith(
      0,
      0,
      TANK_CHASSIS_DRAW_WIDTH,
      TANK_CHASSIS_DRAW_HEIGHT,
    );
    expect(harness.compositeOperations).toEqual([
      'multiply',
      'destination-in',
      'source-over',
    ]);
    expect(targetDrawImage).toHaveBeenCalledWith(
      harness.canvases[0],
      120 - TANK_CHASSIS_DRAW_WIDTH / 2,
      300 - TANK_CHASSIS_DRAW_HEIGHT,
    );

    expect(art.draw(target, 120, 300, '#e53935')).toBe(true);
    expect(harness.canvases).toHaveLength(1);

    expect(art.draw(target, 540, 280, '#2f79ff')).toBe(true);
    expect(harness.canvases).toHaveLength(2);
    expect(harness.drawImage).toHaveBeenCalledTimes(4);
  });

  it('settles only after the first successful battlefield draw', () => {
    const image = controlledImage();
    const harness = tintCanvasHarness();
    const art = new TankChassisArt(
      () => image as unknown as HTMLImageElement,
      harness.factory,
      '/',
    );
    settleValid(image);

    expect(art.draw(
      {
        drawImage: () => {
          throw new Error('target context lost');
        },
      } as unknown as CanvasRenderingContext2D,
      120,
      300,
      '#e53935',
    )).toBe(false);
    expect(art.state).toBe('ready');
    expect(art.isSettled).toBe(false);

    expect(art.draw(
      { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
      120,
      300,
      '#e53935',
    )).toBe(true);
    expect(art.isSettled).toBe(true);
    expect(harness.canvases).toHaveLength(1);
  });

  it.each([
    {
      name: 'network or decode error',
      settle(image: ControlledImage): void {
        image.onerror?.();
      },
    },
    {
      name: 'wrong width',
      settle(image: ControlledImage): void {
        image.naturalWidth = TANK_CHASSIS_SOURCE_WIDTH * 2;
        image.naturalHeight = TANK_CHASSIS_SOURCE_HEIGHT;
        image.onload?.();
      },
    },
    {
      name: 'wrong height',
      settle(image: ControlledImage): void {
        image.naturalWidth = TANK_CHASSIS_SOURCE_WIDTH;
        image.naturalHeight = TANK_CHASSIS_SOURCE_HEIGHT * 2;
        image.onload?.();
      },
    },
  ])('fails closed for $name', ({ settle }) => {
    const image = controlledImage();
    const harness = tintCanvasHarness();
    const art = new TankChassisArt(
      () => image as unknown as HTMLImageElement,
      harness.factory,
      '/',
    );

    settle(image);

    expect(art.state).toBe('failed');
    expect(art.isSettled).toBe(true);
    expect(art.draw(
      { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
      120,
      300,
      '#e53935',
    )).toBe(false);
    expect(harness.canvases).toHaveLength(0);
  });

  it('fails closed when an offscreen tint canvas has no 2D context', () => {
    const image = controlledImage();
    const art = new TankChassisArt(
      () => image as unknown as HTMLImageElement,
      () => ({
        width: 0,
        height: 0,
        getContext: () => null,
      }) as unknown as HTMLCanvasElement,
      '/',
    );
    settleValid(image);

    expect(art.draw(
      { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
      120,
      300,
      '#e53935',
    )).toBe(false);
    expect(art.state).toBe('failed');
    expect(art.isSettled).toBe(true);
  });

  it('settles fallback at timeout but accepts a valid late chassis decode', () => {
    vi.useFakeTimers();
    try {
      const image = controlledImage();
      const harness = tintCanvasHarness();
      const art = new TankChassisArt(
        () => image as unknown as HTMLImageElement,
        harness.factory,
        '/',
      );

      vi.advanceTimersByTime(TANK_CHASSIS_LOAD_TIMEOUT_MS);

      expect(art.state).toBe('timed_out');
      expect(art.isSettled).toBe(true);

      settleValid(image);

      expect(art.state).toBe('ready');
      expect(art.isSettled).toBe(false);
      expect(art.draw(
        { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
        120,
        300,
        '#e53935',
      )).toBe(true);
      expect(harness.canvases).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('notifies a waiting consumer exactly once after a valid late decode', () => {
    vi.useFakeTimers();
    try {
      const image = controlledImage();
      const art = new TankChassisArt(
        () => image as unknown as HTMLImageElement,
        tintCanvasHarness().factory,
        '/',
      );
      const ready = vi.fn();
      art.onReady(ready);

      vi.advanceTimersByTime(TANK_CHASSIS_LOAD_TIMEOUT_MS);
      expect(ready).not.toHaveBeenCalled();

      settleValid(image);
      image.onload?.();
      expect(ready).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

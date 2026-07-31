import { describe, expect, it, vi } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import {
  BattlefieldBackdrop,
  type BackdropImageFactory,
} from './BattlefieldBackdrop';

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

function factoryFor(image: ControlledImage): {
  factory: BackdropImageFactory;
  allocations: () => number;
} {
  let count = 0;
  return {
    factory: () => {
      count++;
      return image as unknown as HTMLImageElement;
    },
    allocations: () => count,
  };
}

describe('BattlefieldBackdrop', () => {
  it('allocates once and keeps the procedural fallback while the image loads', () => {
    const image = controlledImage();
    const { factory, allocations } = factoryFor(image);
    const backdrop = new BattlefieldBackdrop(factory, '/singedTerra/');
    const drawImage = vi.fn();

    expect(allocations()).toBe(1);
    expect(image.src).toBe('/singedTerra/art/battlefield-backdrop.webp');
    expect(backdrop.state).toBe('loading');
    expect(backdrop.isSettled).toBe(false);
    expect(backdrop.draw({ drawImage } as unknown as CanvasRenderingContext2D))
      .toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('draws a valid decoded 2:1 image fitted to the logical battlefield', () => {
    const image = controlledImage();
    const { factory } = factoryFor(image);
    const backdrop = new BattlefieldBackdrop(factory, '/');
    const drawImage = vi.fn();

    image.naturalWidth = 1_774;
    image.naturalHeight = 887;
    image.onload?.();

    expect(backdrop.state).toBe('ready');
    // A decoded image is not settled into the visible frame until draw()
    // acknowledges it; otherwise an idle frame loop can skip the transition.
    expect(backdrop.isSettled).toBe(false);
    expect(backdrop.draw({ drawImage } as unknown as CanvasRenderingContext2D))
      .toBe(true);
    expect(backdrop.isSettled).toBe(true);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage).toHaveBeenCalledWith(
      image,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
    );
  });

  it('preserves the 2:1 image while overscanning translated battlefield edges', () => {
    const image = controlledImage();
    const { factory } = factoryFor(image);
    const backdrop = new BattlefieldBackdrop(factory, '/');
    const drawImage = vi.fn();

    image.naturalWidth = 1_774;
    image.naturalHeight = 887;
    image.onload?.();

    expect(backdrop.draw(
      { drawImage } as unknown as CanvasRenderingContext2D,
      16,
    )).toBe(true);
    expect(drawImage).toHaveBeenCalledWith(
      image,
      -16,
      -8,
      CANVAS_WIDTH + 32,
      CANVAS_HEIGHT + 16,
    );
  });

  it.each([
    {
      name: 'network or decode error',
      settle(image: ControlledImage): void {
        image.onerror?.();
      },
    },
    {
      name: 'wrong decoded aspect ratio',
      settle(image: ControlledImage): void {
        image.naturalWidth = 1_774;
        image.naturalHeight = 900;
        image.onload?.();
      },
    },
    {
      name: 'zero decoded dimensions',
      settle(image: ControlledImage): void {
        image.onload?.();
      },
    },
  ])('fails closed for $name', ({ settle }) => {
    const image = controlledImage();
    const { factory } = factoryFor(image);
    const backdrop = new BattlefieldBackdrop(factory, '/');
    const drawImage = vi.fn();

    settle(image);

    expect(backdrop.state).toBe('failed');
    expect(backdrop.isSettled).toBe(true);
    expect(backdrop.draw({ drawImage } as unknown as CanvasRenderingContext2D))
      .toBe(false);
    expect(drawImage).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from 'vitest';
import { Renderer } from './Renderer';

interface RendererTestSeam {
  ctx: CanvasRenderingContext2D;
  bursts: Array<{
    cx: number;
    cy: number;
    radius: number;
    color: string;
    rgb: [number, number, number];
    core: [number, number, number];
    age: number;
    lifeFrames: number;
    style: 'blast' | 'cluster';
  }>;
  drawExplosions(): void;
}

describe('Renderer blast reach', () => {
  it('draws full-grown normal and cluster fireballs at the shared reach radii', () => {
    const arcRadii: number[] = [];
    const gradient = { addColorStop() {} };
    const ctx = {
      save() {},
      restore() {},
      createRadialGradient() { return gradient; },
      beginPath() {},
      arc(_x: number, _y: number, radius: number) { arcRadii.push(radius); },
      fill() {},
      fillRect() {},
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;
    const renderer = Object.create(Renderer.prototype) as RendererTestSeam;
    renderer.ctx = ctx;
    renderer.bursts = [
      {
        cx: 100, cy: 100, radius: 30, color: '#fff',
        rgb: [255, 255, 255], core: [255, 255, 255],
        age: 18, lifeFrames: 100, style: 'blast',
      },
      {
        cx: 200, cy: 100, radius: 30, color: '#fff',
        rgb: [255, 255, 255], core: [255, 255, 255],
        age: 18, lifeFrames: 100, style: 'cluster',
      },
    ];

    renderer.drawExplosions();

    expect(arcRadii).toEqual([54, 42]);
  });
});

/**
 * Static, render-only ash-cloud art for the battlefield sky.
 *
 * The authored geometry is intentionally fixed: it adds depth without clock
 * state, randomness, engine fields, or a perpetual redraw requirement. Renderer
 * impact parallax moves the completed layer as one far-atmosphere surface.
 */

export const ATMOSPHERE_CLOUD_WIDTH = 1200;
export const ATMOSPHERE_CLOUD_HEIGHT = 600;

export interface AtmosphereCloudLobe {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
}

export interface AtmosphereCloudBank {
  readonly depth: 'far' | 'near';
  readonly body: string;
  readonly shadow: string;
  readonly rim: '#ffe9a8';
  readonly rimAlpha: number;
  readonly lobes: ReadonlyArray<Readonly<AtmosphereCloudLobe>>;
}

function lobe(
  x: number,
  y: number,
  rx: number,
  ry: number,
): Readonly<AtmosphereCloudLobe> {
  return Object.freeze({ x, y, rx, ry });
}

function bank(
  depth: AtmosphereCloudBank['depth'],
  body: string,
  shadow: string,
  rimAlpha: number,
  lobes: ReadonlyArray<Readonly<AtmosphereCloudLobe>>,
): Readonly<AtmosphereCloudBank> {
  return Object.freeze({
    depth,
    body,
    shadow,
    rim: '#ffe9a8' as const,
    rimAlpha,
    lobes: Object.freeze(lobes),
  });
}

/**
 * Four shelves cover the panoramic 1200px field without hiding the horizon.
 * Far banks are softer and higher; near banks carry more contrast and sit lower.
 */
export const ATMOSPHERE_CLOUD_BANKS: ReadonlyArray<Readonly<AtmosphereCloudBank>> =
  Object.freeze([
    bank('far', 'rgba(34, 18, 55, 0.34)', 'rgba(9, 4, 18, 0.16)', 0.025, [
      lobe(-48, 102, 112, 34),
      lobe(42, 94, 86, 42),
      lobe(120, 101, 92, 32),
      lobe(198, 90, 74, 41),
      lobe(268, 104, 106, 31),
      lobe(354, 98, 92, 36),
    ]),
    bank('far', 'rgba(47, 23, 67, 0.31)', 'rgba(12, 6, 24, 0.15)', 0.035, [
      lobe(742, 82, 92, 30),
      lobe(816, 72, 74, 38),
      lobe(886, 82, 88, 30),
      lobe(966, 68, 82, 40),
      lobe(1044, 80, 96, 32),
      lobe(1134, 72, 88, 38),
      lobe(1218, 86, 126, 34),
    ]),
    bank('near', 'rgba(24, 12, 38, 0.50)', 'rgba(7, 3, 14, 0.24)', 0.055, [
      lobe(126, 190, 104, 38),
      lobe(220, 177, 88, 50),
      lobe(306, 188, 102, 40),
      lobe(396, 171, 84, 52),
      lobe(476, 186, 112, 42),
      lobe(574, 180, 104, 48),
    ]),
    bank('near', 'rgba(29, 14, 43, 0.46)', 'rgba(8, 4, 16, 0.22)', 0.06, [
      lobe(646, 156, 94, 36),
      lobe(732, 143, 82, 48),
      lobe(812, 154, 98, 38),
      lobe(904, 138, 88, 51),
      lobe(990, 152, 108, 40),
      lobe(1088, 141, 92, 48),
      lobe(1174, 158, 116, 38),
    ]),
  ]);

export type AtmosphereCanvasFactory = () => HTMLCanvasElement;

function defaultCanvasFactory(): HTMLCanvasElement {
  return document.createElement('canvas');
}

/**
 * Lazily rasterizes the authored cloud geometry once, then reuses the transparent
 * canvas on every frame. This keeps richer art out of the hot render path.
 */
export class AtmosphereCloudLayer {
  private surface: HTMLCanvasElement | null = null;

  constructor(
    private readonly createCanvas: AtmosphereCanvasFactory = defaultCanvasFactory,
  ) {}

  draw(target: CanvasRenderingContext2D): void {
    target.drawImage(this.getSurface(), 0, 0);
  }

  private getSurface(): HTMLCanvasElement {
    if (this.surface) return this.surface;

    const surface = this.createCanvas();
    surface.width = ATMOSPHERE_CLOUD_WIDTH;
    surface.height = ATMOSPHERE_CLOUD_HEIGHT;
    const ctx = surface.getContext('2d');
    if (!ctx) throw new Error('Failed to acquire atmospheric cloud context');

    for (const cloud of ATMOSPHERE_CLOUD_BANKS) {
      ctx.save();

      ctx.fillStyle = cloud.shadow;
      ctx.beginPath();
      for (const part of cloud.lobes) {
        ctx.ellipse(part.x, part.y + 9, part.rx, part.ry, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.fillStyle = cloud.body;
      ctx.beginPath();
      for (const part of cloud.lobes) {
        ctx.ellipse(part.x, part.y, part.rx, part.ry, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      // A restrained warm contour ties the cool ash masses to the sunset without
      // making them read as bright UI or explosion effects.
      ctx.globalAlpha = cloud.rimAlpha;
      ctx.strokeStyle = cloud.rim;
      ctx.lineWidth = cloud.depth === 'near' ? 2.2 : 1.4;
      ctx.beginPath();
      for (let index = 0; index < cloud.lobes.length; index += 2) {
        const part = cloud.lobes[index]!;
        const start = Math.PI * 1.18;
        // Canvas joins consecutive open arcs with a straight segment unless the
        // pen is moved to each arc's exact start. Keep crowns independent.
        ctx.moveTo(
          part.x + Math.cos(start) * part.rx,
          part.y - 1 + Math.sin(start) * part.ry,
        );
        ctx.ellipse(
          part.x,
          part.y - 1,
          part.rx,
          part.ry,
          0,
          start,
          Math.PI * 1.82,
        );
      }
      ctx.stroke();
      ctx.restore();
    }

    this.surface = surface;
    return surface;
  }
}

import type { TankState } from '@shared/types/GameState';
import {
  DEFAULT_TANK_PART_SET,
  TANK_PART_ATLAS_ASSET,
  TANK_PART_ATLAS_HEIGHT,
  TANK_PART_ATLAS_WIDTH,
  TANK_PART_SLOTS,
  tankBarrelMount,
  type TankPartDefinition,
  type TankPartSet,
  type TankPartSlot,
} from './tankPartCatalog';

export const TANK_PART_LOAD_TIMEOUT_MS = 5_000;

export type TankPartArtState = 'loading' | 'ready' | 'failed';
export type TankPartImageFactory = () => HTMLImageElement;
export type TankPartCanvasFactory = () => HTMLCanvasElement;

export interface TankPartPainter {
  readonly state: TankPartArtState;
  readonly isSettled: boolean;
  drawStatic(
    ctx: CanvasRenderingContext2D,
    tank: Readonly<TankState>,
  ): boolean;
  drawBarrel(
    ctx: CanvasRenderingContext2D,
    tank: Readonly<TankState>,
  ): boolean;
}

function createBrowserImage(): HTMLImageElement {
  return new Image();
}

function createBrowserCanvas(): HTMLCanvasElement {
  return document.createElement('canvas');
}

function assetUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${TANK_PART_ATLAS_ASSET}`;
}

/**
 * Loads one four-cell atlas and lazily caches each slot/color combination.
 * The renderer retains its previous authored/procedural fallbacks whenever this
 * painter is not ready or a draw fails.
 */
export class TankPartArt implements TankPartPainter {
  private readonly image: HTMLImageElement;
  private readonly variants = new Map<string, HTMLCanvasElement>();
  private readonly paintedSlots = new Set<TankPartSlot>();
  private currentState: TankPartArtState = 'loading';
  private loadTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    createImage: TankPartImageFactory = createBrowserImage,
    private readonly createCanvas: TankPartCanvasFactory =
      createBrowserCanvas,
    baseUrl: string = import.meta.env.BASE_URL,
    private readonly partSet: TankPartSet = DEFAULT_TANK_PART_SET,
  ) {
    this.image = createImage();
    this.image.onload = () => {
      if (this.currentState !== 'loading') return;
      if (
        this.image.naturalWidth !== TANK_PART_ATLAS_WIDTH
        || this.image.naturalHeight !== TANK_PART_ATLAS_HEIGHT
      ) {
        this.fail();
        return;
      }
      this.clearLoadTimeout();
      this.currentState = 'ready';
    };
    this.image.onerror = () => this.fail();
    this.loadTimeout = globalThis.setTimeout(
      () => this.fail(),
      TANK_PART_LOAD_TIMEOUT_MS,
    );
    this.image.src = assetUrl(baseUrl);
  }

  get state(): TankPartArtState {
    return this.currentState;
  }

  get isSettled(): boolean {
    return (
      this.currentState === 'failed'
      || (
        this.currentState === 'ready'
        && this.paintedSlots.size === TANK_PART_SLOTS.length
      )
    );
  }

  /** Test/debug seam: which independently cached slots exist for one color. */
  cachedSlots(color: string): TankPartSlot[] {
    return TANK_PART_SLOTS.filter((slot) =>
      this.variants.has(this.cacheKey(slot, color)));
  }

  drawStatic(
    ctx: CanvasRenderingContext2D,
    tank: Readonly<TankState>,
  ): boolean {
    if (this.currentState !== 'ready') return false;
    const slots = ['treads', 'hull', 'turret'] as const;
    const prepared = slots.map((slot) => ({
      slot,
      definition: this.partSet.parts[slot],
      variant: this.variantFor(slot, tank.color),
    }));
    if (prepared.some(({ variant }) => variant === null)) return false;

    try {
      for (const { slot, definition, variant } of prepared) {
        ctx.drawImage(
          variant!,
          tank.x + definition.offsetX,
          tank.y + definition.offsetY,
        );
        this.paintedSlots.add(slot);
      }
      return true;
    } catch {
      this.fail();
      return false;
    }
  }

  drawBarrel(
    ctx: CanvasRenderingContext2D,
    tank: Readonly<TankState>,
  ): boolean {
    if (this.currentState !== 'ready') return false;
    const definition = this.partSet.parts.barrel;
    const variant = this.variantFor('barrel', tank.color);
    if (variant === null) return false;
    const mount = tankBarrelMount(tank);

    try {
      ctx.save();
      ctx.translate(mount.pivot.x, mount.pivot.y);
      ctx.rotate(mount.radians);
      // A tight silhouette keeps red barrels readable against the red dusk sky
      // without flattening the authored rivets and muzzle detail.
      ctx.shadowColor = '#10070b';
      ctx.shadowBlur = 0.75;
      ctx.drawImage(variant, definition.offsetX, definition.offsetY);
      ctx.restore();
      this.paintedSlots.add('barrel');
      return true;
    } catch {
      // Balance a successful save even when a later transform/draw throws.
      try {
        ctx.restore();
      } catch {
        // Target context is already unusable; the renderer will draw fallback.
      }
      this.fail();
      return false;
    }
  }

  private variantFor(
    slot: TankPartSlot,
    color: string,
  ): HTMLCanvasElement | null {
    const key = this.cacheKey(slot, color);
    const cached = this.variants.get(key);
    if (cached !== undefined) return cached;
    const definition = this.partSet.parts[slot];

    try {
      const canvas = this.createCanvas();
      canvas.width = definition.width;
      canvas.height = definition.height;
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        this.fail();
        return null;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      this.drawSource(ctx, definition);

      // The chassis carries player identity. Keep the barrel neutral steel so
      // its authored muzzle and highlight remain legible against every sky.
      if (slot === 'barrel') {
        this.variants.set(key, canvas);
        return canvas;
      }

      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      // Multiply intentionally paints through transparent pixels. Restore the
      // authored alpha once; the fill has made destination alpha opaque, so
      // this does not square the source edge alpha.
      ctx.globalCompositeOperation = 'destination-in';
      this.drawSource(ctx, definition);
      ctx.globalCompositeOperation = 'source-over';
      this.variants.set(key, canvas);
      return canvas;
    } catch {
      this.fail();
      return null;
    }
  }

  private drawSource(
    ctx: CanvasRenderingContext2D,
    definition: TankPartDefinition,
  ): void {
    const source = definition.source;
    ctx.drawImage(
      this.image,
      source.x,
      source.y,
      source.width,
      source.height,
      0,
      0,
      definition.width,
      definition.height,
    );
  }

  private cacheKey(slot: TankPartSlot, color: string): string {
    return `${this.partSet.id}:${slot}:${color}`;
  }

  private fail(): void {
    if (this.currentState === 'failed') return;
    this.clearLoadTimeout();
    this.currentState = 'failed';
    this.variants.clear();
    this.paintedSlots.clear();
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeout === null) return;
    globalThis.clearTimeout(this.loadTimeout);
    this.loadTimeout = null;
  }
}

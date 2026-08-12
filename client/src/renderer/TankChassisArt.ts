export const TANK_CHASSIS_ASSET = 'art/tank-chassis.webp';
export const TANK_CHASSIS_SOURCE_WIDTH = 256;
export const TANK_CHASSIS_SOURCE_HEIGHT = 128;
// The asset's occupied alpha width lands at about 34px, close to the prior
// 32px procedural tread footprint and its collision-readable silhouette.
export const TANK_CHASSIS_DRAW_WIDTH = 36;
export const TANK_CHASSIS_DRAW_HEIGHT = 24;
export const TANK_CHASSIS_LOAD_TIMEOUT_MS = 5_000;

export type TankChassisArtState =
  | 'loading'
  | 'timed_out'
  | 'ready'
  | 'failed';
export type TankChassisImageFactory = () => HTMLImageElement;
export type TankChassisCanvasFactory = () => HTMLCanvasElement;

export interface TankChassisPainter {
  readonly isSettled: boolean;
  onReady(listener: () => void): () => void;
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
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
  return `${normalizedBase}${TANK_CHASSIS_ASSET}`;
}

/**
 * Loads one neutral chassis and lazily caches its player-color variants.
 * Loading and decode failures leave the procedural TankRenderer fallback intact.
 */
export class TankChassisArt implements TankChassisPainter {
  private readonly image: HTMLImageElement;
  private readonly variants = new Map<string, HTMLCanvasElement>();
  private readonly readyListeners = new Set<() => void>();
  private currentState: TankChassisArtState = 'loading';
  private pendingFirstPaint = false;
  private loadTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    createImage: TankChassisImageFactory = createBrowserImage,
    private readonly createCanvas: TankChassisCanvasFactory =
      createBrowserCanvas,
    baseUrl: string = import.meta.env.BASE_URL,
  ) {
    this.image = createImage();
    this.image.onload = () => {
      if (
        this.currentState !== 'loading'
        && this.currentState !== 'timed_out'
      ) return;
      if (
        this.image.naturalWidth !== TANK_CHASSIS_SOURCE_WIDTH
        || this.image.naturalHeight !== TANK_CHASSIS_SOURCE_HEIGHT
      ) {
        this.fail();
        return;
      }
      this.clearLoadTimeout();
      this.currentState = 'ready';
      this.pendingFirstPaint = true;
      this.notifyReady();
    };
    this.image.onerror = () => this.fail();
    this.loadTimeout = globalThis.setTimeout(
      () => this.timeout(),
      TANK_CHASSIS_LOAD_TIMEOUT_MS,
    );
    this.image.src = assetUrl(baseUrl);
  }

  get state(): TankChassisArtState {
    return this.currentState;
  }

  get isSettled(): boolean {
    return (
      this.currentState === 'failed'
      || this.currentState === 'timed_out'
      || (this.currentState === 'ready' && !this.pendingFirstPaint)
    );
  }

  onReady(listener: () => void): () => void {
    if (this.currentState === 'ready') {
      listener();
      return () => undefined;
    }
    if (this.currentState === 'failed') return () => undefined;
    this.readyListeners.add(listener);
    return () => this.readyListeners.delete(listener);
  }

  /**
   * Draw the player-tinted chassis centered on x with its frame bottom at y.
   * Returns false whenever the caller should use the procedural fallback.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
  ): boolean {
    if (this.currentState !== 'ready') return false;

    const variant = this.variantFor(color);
    if (variant === null) return false;

    try {
      ctx.drawImage(
        variant,
        x - TANK_CHASSIS_DRAW_WIDTH / 2,
        y - TANK_CHASSIS_DRAW_HEIGHT,
      );
      this.pendingFirstPaint = false;
      return true;
    } catch {
      // A transient target-context failure must not poison the reusable asset.
      return false;
    }
  }

  private variantFor(color: string): HTMLCanvasElement | null {
    const cached = this.variants.get(color);
    if (cached !== undefined) return cached;

    try {
      const canvas = this.createCanvas();
      canvas.width = TANK_CHASSIS_DRAW_WIDTH;
      canvas.height = TANK_CHASSIS_DRAW_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx === null) {
        this.fail();
        return null;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        this.image,
        0,
        0,
        TANK_CHASSIS_SOURCE_WIDTH,
        TANK_CHASSIS_SOURCE_HEIGHT,
        0,
        0,
        TANK_CHASSIS_DRAW_WIDTH,
        TANK_CHASSIS_DRAW_HEIGHT,
      );
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = color;
      ctx.fillRect(
        0,
        0,
        TANK_CHASSIS_DRAW_WIDTH,
        TANK_CHASSIS_DRAW_HEIGHT,
      );
      // Reapply the authored alpha after color composition so hidden source RGB
      // and semi-transparent antialiasing can never become a rectangular plate.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(
        this.image,
        0,
        0,
        TANK_CHASSIS_SOURCE_WIDTH,
        TANK_CHASSIS_SOURCE_HEIGHT,
        0,
        0,
        TANK_CHASSIS_DRAW_WIDTH,
        TANK_CHASSIS_DRAW_HEIGHT,
      );
      ctx.globalCompositeOperation = 'source-over';
      this.variants.set(color, canvas);
      return canvas;
    } catch {
      this.fail();
      return null;
    }
  }

  private fail(): void {
    if (this.currentState === 'failed') return;
    this.clearLoadTimeout();
    this.variants.clear();
    this.pendingFirstPaint = false;
    this.currentState = 'failed';
    this.readyListeners.clear();
  }

  private timeout(): void {
    if (this.currentState !== 'loading') return;
    this.clearLoadTimeout();
    this.variants.clear();
    this.pendingFirstPaint = false;
    this.currentState = 'timed_out';
  }

  private notifyReady(): void {
    const listeners = [...this.readyListeners];
    this.readyListeners.clear();
    for (const listener of listeners) listener();
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeout === null) return;
    globalThis.clearTimeout(this.loadTimeout);
    this.loadTimeout = null;
  }
}

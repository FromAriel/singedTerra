import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';

export const BATTLEFIELD_BACKDROP_ASSET =
  'art/battlefield-backdrop.webp';

export type BattlefieldBackdropState = 'loading' | 'ready' | 'failed';
export type BackdropImageFactory = () => HTMLImageElement;

function createBrowserImage(): HTMLImageElement {
  return new Image();
}

function assetUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${BATTLEFIELD_BACKDROP_ASSET}`;
}

/**
 * Owns one decoded panorama for the page-level renderer.
 *
 * Loading and failures deliberately return `false` from draw(): the caller can
 * keep painting the complete procedural atmosphere until this layer is ready.
 */
export class BattlefieldBackdrop {
  private readonly image: HTMLImageElement;
  private currentState: BattlefieldBackdropState = 'loading';
  private pendingFirstDraw = false;

  constructor(
    createImage: BackdropImageFactory = createBrowserImage,
    baseUrl: string = import.meta.env.BASE_URL,
  ) {
    this.image = createImage();
    this.image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = this.image;
      const isValid = (
        Number.isFinite(width)
        && Number.isFinite(height)
        && width > 0
        && height > 0
        && width === height * 2
      );
      this.currentState = isValid ? 'ready' : 'failed';
      this.pendingFirstDraw = isValid;
    };
    this.image.onerror = () => {
      this.currentState = 'failed';
      this.pendingFirstDraw = false;
    };
    this.image.src = assetUrl(baseUrl);
  }

  get state(): BattlefieldBackdropState {
    return this.currentState;
  }

  get isSettled(): boolean {
    return (
      this.currentState === 'failed'
      || (this.currentState === 'ready' && !this.pendingFirstDraw)
    );
  }

  draw(ctx: CanvasRenderingContext2D, overscan = 0): boolean {
    if (this.currentState !== 'ready') return false;
    const x = overscan === 0 ? 0 : -overscan;
    const y = overscan === 0 ? 0 : -overscan / 2;
    ctx.drawImage(
      this.image,
      x,
      y,
      CANVAS_WIDTH + overscan * 2,
      CANVAS_HEIGHT + overscan,
    );
    this.pendingFirstDraw = false;
    return true;
  }
}

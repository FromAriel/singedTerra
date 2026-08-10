import { ACCENT, BACKDROP, FONT, TEXT } from '../ui/theme';
import {
  IMPACT_MONITOR_FRAME_HEIGHT,
  IMPACT_MONITOR_FRAME_WIDTH,
  type ImpactMonitorGeometry,
} from './impactMonitor';
import type { ImpactLearningCue } from './impactLearning';

export type ImpactMonitorCanvasFactory = () => HTMLCanvasElement;

function createCanvas(): HTMLCanvasElement {
  return document.createElement('canvas');
}

export class ImpactMonitorPainter {
  private readonly compositeCanvas: HTMLCanvasElement | null;
  private readonly compositeContext: CanvasRenderingContext2D | null;

  constructor(createCompositeCanvas: ImpactMonitorCanvasFactory = createCanvas) {
    try {
      const canvas = createCompositeCanvas();
      canvas.width = IMPACT_MONITOR_FRAME_WIDTH;
      canvas.height = IMPACT_MONITOR_FRAME_HEIGHT;
      this.compositeCanvas = canvas;
      this.compositeContext = canvas.getContext('2d');
    } catch {
      this.compositeCanvas = null;
      this.compositeContext = null;
    }
  }

  draw(
    target: CanvasRenderingContext2D,
    geometry: ImpactMonitorGeometry | null,
    reduceMotion: boolean,
    cue: ImpactLearningCue | null = null,
  ): boolean {
    const canvas = this.compositeCanvas;
    const ctx = this.compositeContext;
    if (reduceMotion || geometry === null || !canvas || !ctx) return false;

    const { content, frame, source } = geometry;
    const scale = frame.width / IMPACT_MONITOR_FRAME_WIDTH;
    if (!Number.isFinite(scale) || scale <= 0) return false;
    const bufferWidth = Math.ceil(frame.width);
    const bufferHeight = Math.ceil(frame.height);
    if (canvas.width !== bufferWidth) canvas.width = bufferWidth;
    if (canvas.height !== bufferHeight) canvas.height = bufferHeight;
    const contentX = content.x - frame.x;
    const contentY = content.y - frame.y;
    let savedDepth = 0;
    let composed = false;

    try {
      ctx.clearRect(0, 0, frame.width, frame.height);
      ctx.save();
      savedDepth += 1;

      // Keep the shadow inside the atomic composite so a failed target paint
      // cannot leave any monitor fragment behind on the battlefield.
      ctx.fillStyle = 'rgba(12, 7, 22, 0.72)';
      ctx.fillRect(3 * scale, 4 * scale, frame.width - 3 * scale, frame.height - 4 * scale);
      ctx.fillStyle = BACKDROP;
      ctx.fillRect(0, 0, frame.width - 3 * scale, frame.height - 3 * scale);

      ctx.save();
      savedDepth += 1;
      ctx.beginPath();
      ctx.roundRect(
        contentX,
        contentY,
        content.width,
        content.height,
        7 * scale,
      );
      ctx.clip();
      ctx.drawImage(
        target.canvas,
        source.x,
        source.y,
        source.width,
        source.height,
        contentX,
        contentY,
        content.width,
        content.height,
      );
      ctx.restore();
      savedDepth -= 1;

      ctx.lineWidth = scale;
      ctx.strokeStyle = ACCENT.gold;
      ctx.strokeRect(0.5 * scale, 0.5 * scale, frame.width - scale, frame.height - scale);
      ctx.strokeStyle = 'rgba(255, 210, 63, 0.34)';
      ctx.strokeRect(4.5 * scale, 4.5 * scale, frame.width - 9 * scale, frame.height - 9 * scale);

      ctx.fillStyle = BACKDROP;
      ctx.fillRect(12 * scale, 7 * scale, 111 * scale, 19 * scale);
      ctx.fillStyle = TEXT.gold;
      ctx.font = `700 ${11 * scale}px ${FONT.mono}`;
      ctx.textBaseline = 'middle';
      ctx.fillText('IMPACT MONITOR', 18 * scale, 21 * scale);

      if (cue !== null) {
        ctx.fillStyle = 'rgba(12, 7, 22, 0.88)';
        ctx.fillRect(10 * scale, 96 * scale, 200 * scale, 34 * scale);
        ctx.fillStyle = TEXT.body;
        ctx.font = `700 ${10 * scale}px ${FONT.mono}`;
        ctx.fillText(
          cue.readout,
          18 * scale,
          107 * scale,
          184 * scale,
        );
        ctx.fillStyle = ACCENT.solution;
        ctx.font = `700 ${8 * scale}px ${FONT.mono}`;
        ctx.fillText(
          cue.correction,
          18 * scale,
          122 * scale,
          184 * scale,
        );
      }
      composed = true;
    } catch {
      composed = false;
    } finally {
      while (savedDepth > 0) {
        try {
          ctx.restore();
          savedDepth -= 1;
        } catch {
          composed = false;
          break;
        }
      }
    }

    if (!composed) return false;

    try {
      // This is the only target-canvas paint. Canvas drawImage is atomic: if it
      // throws, the already-composed offscreen frame never covers the battlefield.
      target.drawImage(canvas, frame.x, frame.y, frame.width, frame.height);
      return true;
    } catch {
      return false;
    }
  }
}

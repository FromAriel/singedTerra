import type { ComposedFxSnapshot } from './ComposedEngine';

export class ComposedOverlay {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Composed overlay requires a 2D canvas context');
    this.ctx = ctx;
  }

  /** Draw after ApocalypseOverlay; intentionally does not clear the shared FX canvas. */
  render(fx: ComposedFxSnapshot): void {
    if (!fx.active && fx.flash < 0.02) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    for (const streak of fx.streaks) {
      const speed = Math.max(1, Math.hypot(streak.vx, streak.vy));
      const ux = streak.vx / speed;
      const uy = streak.vy / speed;
      const length = fx.style === 'wall' ? 16 : fx.style === 'fan' ? 12 : 20;

      ctx.shadowBlur = fx.style === 'tap' ? 14 : 10;
      ctx.shadowColor = fx.color;
      ctx.strokeStyle = fx.color;
      ctx.globalAlpha = 0.82;
      ctx.lineWidth = fx.style === 'tap' ? 2.2 : 1.35;
      ctx.beginPath();
      ctx.moveTo(streak.x - ux * length, streak.y - uy * length);
      ctx.lineTo(streak.x, streak.y);
      ctx.stroke();

      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(streak.x, streak.y, fx.style === 'tap' ? 2.4 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (fx.flash > 0.02) {
      ctx.globalAlpha = Math.min(0.22, fx.flash * 0.2);
      ctx.fillStyle = fx.color;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.restore();
  }
}

import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@shared/engine/Terrain';
import type { GameState } from '@shared/types/GameState';
import type {
  ApocalypseFxSnapshot,
  ApocalypseSequence,
  ChronoSequence,
  PlanetcrackerSequence,
  RiftSequence,
  SingularitySequence,
  SkybreakerSequence,
  Vec2,
  WormholeSequence,
} from './ApocalypseEngine';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hash01(seed: number): number {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0x1_0000_0000;
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

export class ApocalypseOverlay {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Apocalypse overlay requires a 2D canvas context');
    this.ctx = ctx;
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  render(fx: ApocalypseFxSnapshot, state: GameState): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawAmbient(fx, state);
    if (fx.sequence) this.drawSequence(fx.sequence, fx);
    if (fx.flash > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rgba(255, 244, 218, fx.flash * 0.34);
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  private drawAmbient(fx: ApocalypseFxSnapshot, state: GameState): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const wind = state.wind;
    const pulse = 0.02 + Math.abs(wind) * 0.002 + fx.pulse * 0.03;
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    gradient.addColorStop(0, rgba(0, 214, 255, 0));
    gradient.addColorStop(0.28, rgba(56, 122, 255, pulse));
    gradient.addColorStop(0.55, rgba(199, 77, 255, pulse * 1.4));
    gradient.addColorStop(0.82, rgba(0, 255, 188, pulse));
    gradient.addColorStop(1, rgba(0, 214, 255, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 165);
    ctx.restore();
  }

  private drawSequence(sequence: ApocalypseSequence, fx: ApocalypseFxSnapshot): void {
    switch (sequence.type) {
      case 'rift_lance': this.drawRift(sequence); break;
      case 'singularity_seed': this.drawSingularity(sequence, fx.tick); break;
      case 'skybreaker': this.drawSkybreaker(sequence); break;
      case 'chrono_echo': this.drawChrono(sequence); break;
      case 'wormhole_pair': this.drawWormholes(sequence, fx.tick); break;
      case 'planetcracker': this.drawPlanetcracker(sequence, fx.tick); break;
    }
  }

  private drawRift(seq: RiftSequence): void {
    const ctx = this.ctx;
    const intro = clamp(seq.age / 7, 0, 1);
    const fade = seq.age < 50 ? 1 : clamp(1 - (seq.age - 50) / 24, 0, 1);
    if (!seq.fired) {
      ctx.save();
      ctx.strokeStyle = rgba(120, 235, 255, 0.24 * intro);
      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(seq.origin.x, seq.origin.y);
      ctx.lineTo(seq.end.x, seq.end.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 34;
    ctx.shadowColor = '#80f7ff';
    for (const width of [22, 11, 4, 1.6]) {
      ctx.strokeStyle = width > 10
        ? rgba(41, 166, 255, 0.14 * fade)
        : width > 3
          ? rgba(82, 230, 255, 0.5 * fade)
          : rgba(255, 255, 255, 0.98 * fade);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(seq.origin.x, seq.origin.y);
      ctx.lineTo(seq.end.x, seq.end.y);
      ctx.stroke();
    }

    if (!this.reducedMotion) {
      for (let branch = 0; branch < 7; branch++) {
        const offset = (hash01(seq.id * 97 + branch * 31 + Math.floor(seq.age / 2)) - 0.5) * 24;
        const t0 = 0.15 + branch * 0.11;
        const ax = seq.origin.x + (seq.end.x - seq.origin.x) * t0;
        const ay = seq.origin.y + (seq.end.y - seq.origin.y) * t0;
        const bx = ax + (seq.end.y - seq.origin.y) * 0.035 + offset;
        const by = ay - (seq.end.x - seq.origin.x) * 0.035 + offset * 0.4;
        ctx.strokeStyle = rgba(144, 102, 255, 0.48 * fade);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawSingularity(seq: SingularitySequence, tick: number): void {
    const ctx = this.ctx;
    if (seq.stage === 'flight') {
      this.drawArcTrail(seq.projectile.trail, '#c36bff', '#ffffff');
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#c76dff';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(seq.projectile.x, seq.projectile.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (!seq.center) return;

    const center = seq.center;
    const fieldLife = seq.stage === 'field' ? clamp(seq.fieldAge / 20, 0, 1) : 1;
    const fade = seq.stage === 'afterglow' ? clamp(1 - (seq.age - 160) / 70, 0, 1) : 1;
    const radius = 18 + fieldLife * 34 + Math.sin(tick * 0.13) * 2;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const halo = ctx.createRadialGradient(center.x, center.y, 2, center.x, center.y, radius * 3.1);
    halo.addColorStop(0, rgba(255, 255, 255, 0.82 * fade));
    halo.addColorStop(0.12, rgba(189, 96, 255, 0.66 * fade));
    halo.addColorStop(0.42, rgba(49, 105, 255, 0.28 * fade));
    halo.addColorStop(1, rgba(0, 0, 0, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(center.x - radius * 3.2, center.y - radius * 3.2, radius * 6.4, radius * 6.4);

    ctx.translate(center.x, center.y);
    ctx.rotate(tick * 0.025);
    for (let ring = 0; ring < 4; ring++) {
      ctx.strokeStyle = ring % 2
        ? rgba(255, 102, 238, (0.55 - ring * 0.09) * fade)
        : rgba(88, 214, 255, (0.62 - ring * 0.1) * fade);
      ctx.lineWidth = 1.5 + (3 - ring) * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1.15 + ring * 0.22), radius * (0.28 + ring * 0.07), ring * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#02030a';
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgba(255, 255, 255, 0.85 * fade);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  private drawSkybreaker(seq: SkybreakerSequence): void {
    const ctx = this.ctx;
    const target = seq.target;
    const warning = clamp(seq.age / 42, 0, 1);
    const beam = seq.age >= 42 ? clamp((seq.age - 42) / 9, 0, 1) : 0;
    const fade = seq.age > 92 ? clamp(1 - (seq.age - 92) / 34, 0, 1) : 1;

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.strokeStyle = rgba(255, 70, 58, 0.72 * warning * fade);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 20 + Math.sin(seq.age * 0.22) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-32, 0); ctx.lineTo(32, 0);
    ctx.moveTo(0, -32); ctx.lineTo(0, 32);
    ctx.stroke();
    ctx.restore();

    if (beam <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 46;
    ctx.shadowColor = '#bdf7ff';
    const widths = [46, 24, 10, 3];
    for (const width of widths) {
      ctx.strokeStyle = width > 20
        ? rgba(76, 178, 255, 0.18 * beam * fade)
        : width > 5
          ? rgba(128, 235, 255, 0.58 * beam * fade)
          : rgba(255, 255, 255, 0.98 * beam * fade);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(target.x, -10);
      ctx.lineTo(target.x, CANVAS_HEIGHT + 10);
      ctx.stroke();
    }
    const bloom = ctx.createRadialGradient(target.x, target.y, 2, target.x, target.y, 95);
    bloom.addColorStop(0, rgba(255, 255, 255, 0.9 * fade));
    bloom.addColorStop(0.15, rgba(155, 241, 255, 0.55 * fade));
    bloom.addColorStop(1, rgba(0, 118, 255, 0));
    ctx.fillStyle = bloom;
    ctx.fillRect(target.x - 110, target.y - 110, 220, 220);
    ctx.restore();
  }

  private drawChrono(seq: ChronoSequence): void {
    const palette = [
      ['#51e9ff', '#ffffff'],
      ['#ff67e6', '#ffffff'],
      ['#ffe66e', '#ffffff'],
    ] as const;
    for (let i = 0; i < seq.shots.length; i++) {
      const shot = seq.shots[i];
      if (!shot) continue;
      const colors = palette[i] ?? palette[0];
      this.drawArcTrail(shot.trail, colors[0], colors[1]);
    }
    const ctx = this.ctx;
    for (const impact of seq.impacts) {
      const fade = clamp(1 - impact.age / 50, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = rgba(158, 103, 255, 0.75 * fade);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(impact.x, impact.y, impact.radius * (0.25 + impact.age / 26), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawWormholes(seq: WormholeSequence, tick: number): void {
    this.drawPortal(seq.a, tick, 1, seq.swapped ? 0.75 : 1);
    this.drawPortal(seq.b, tick, -1, seq.swapped ? 0.75 : 1);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const alpha = seq.swapped ? clamp(1 - (seq.age - 48) / 78, 0, 0.55) : clamp(seq.age / 38, 0, 0.55);
    ctx.strokeStyle = rgba(151, 96, 255, alpha);
    ctx.lineWidth = 1.3;
    ctx.setLineDash([2, 9]);
    ctx.lineDashOffset = -tick * 0.8;
    ctx.beginPath();
    ctx.moveTo(seq.a.x, seq.a.y);
    ctx.bezierCurveTo(seq.a.x, 60, seq.b.x, 60, seq.b.x, seq.b.y);
    ctx.stroke();
    ctx.restore();
  }

  private drawPortal(center: Vec2, tick: number, direction: number, intensity: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(direction * tick * 0.027);
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 28;
    ctx.shadowColor = direction > 0 ? '#5be8ff' : '#e16aff';
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = direction > 0
        ? rgba(70 + i * 16, 200 + i * 8, 255, (0.62 - i * 0.08) * intensity)
        : rgba(220 + i * 5, 70 + i * 15, 255, (0.62 - i * 0.08) * intensity);
      ctx.lineWidth = 2.4 - i * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20 + i * 7, 8 + i * 3, i * 0.28, 0, Math.PI * 1.68);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(2, 3, 12, 0.94 * intensity);
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlanetcracker(seq: PlanetcrackerSequence, tick: number): void {
    const ctx = this.ctx;
    const target = seq.target;
    if (seq.stage === 'warning') {
      const pulse = 0.5 + Math.sin(tick * 0.3) * 0.3;
      ctx.save();
      ctx.strokeStyle = rgba(255, 82, 47, 0.8);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(target.x, target.y, 25 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba(255, 82, 47, 0.9);
      ctx.font = '700 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('KINETIC LOCK', target.x, target.y - 42);
      ctx.restore();
      return;
    }

    if (seq.stage === 'drop' || seq.stage === 'drill') {
      const y = seq.stage === 'drop' ? seq.spearY : seq.impactY;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const trail = ctx.createLinearGradient(target.x, Math.max(-40, y - 180), target.x, y + 8);
      trail.addColorStop(0, rgba(255, 80, 30, 0));
      trail.addColorStop(0.65, rgba(255, 153, 47, 0.34));
      trail.addColorStop(1, rgba(255, 255, 255, 0.95));
      ctx.strokeStyle = trail;
      ctx.lineWidth = 6;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#ff7a2f';
      ctx.beginPath();
      ctx.moveTo(target.x, y - 180);
      ctx.lineTo(target.x, y);
      ctx.stroke();
      ctx.fillStyle = '#fff4d5';
      ctx.fillRect(target.x - 2, y - 15, 4, 22);
      ctx.restore();
    }

    if (seq.stage === 'aftershock') {
      const age = Math.max(0, seq.age - 70);
      const fade = clamp(1 - age / 105, 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let ring = 0; ring < 4; ring++) {
        ctx.strokeStyle = rgba(255, 120 + ring * 22, 55, (0.48 - ring * 0.07) * fade);
        ctx.lineWidth = 3 - ring * 0.4;
        ctx.beginPath();
        ctx.ellipse(target.x, seq.impactY, 38 + age * (1.4 + ring * 0.2), 12 + age * (0.28 + ring * 0.06), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawArcTrail(trail: readonly Vec2[], outer: string, core: string): void {
    if (trail.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.shadowBlur = 14;
    ctx.shadowColor = outer;
    ctx.strokeStyle = outer;
    ctx.lineWidth = 4;
    ctx.beginPath();
    const first = trail[0];
    if (!first) { ctx.restore(); return; }
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < trail.length; i++) {
      const point = trail[i];
      if (point) ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = core;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

import { describe, expect, it } from 'vitest';
import type { WeaponType } from '@shared/engine/WeaponSystem';
import type { ProjectileState } from '@shared/types/GameState';
import { ProjectileRenderer } from './ProjectileRenderer';
import { getProjectileVisualProfile } from './projectileVisuals';

interface CanvasTrace {
  operations: string[];
  arcs: number[];
  arcCalls: Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
    fill: string;
  }>;
  fills: string[];
  rotations: number[];
  saves: number;
  restores: number;
}

function tracingContext(): { ctx: CanvasRenderingContext2D; trace: CanvasTrace } {
  const trace: CanvasTrace = {
    operations: [],
    arcs: [],
    arcCalls: [],
    fills: [],
    rotations: [],
    saves: 0,
    restores: 0,
  };
  let fillStyle = '';
  let strokeStyle = '';
  let globalAlpha = 0.37;
  let lineWidth = 7;
  let lineCap: CanvasLineCap = 'square';
  const stack: Array<{
    fillStyle: string;
    strokeStyle: string;
    globalAlpha: number;
    lineWidth: number;
    lineCap: CanvasLineCap;
  }> = [];

  const ctx = {
    get fillStyle() { return fillStyle; },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      fillStyle = typeof value === 'string' ? value : '[gradient]';
      trace.fills.push(fillStyle);
    },
    get strokeStyle() { return strokeStyle; },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      strokeStyle = typeof value === 'string' ? value : '[gradient]';
    },
    get globalAlpha() { return globalAlpha; },
    set globalAlpha(value: number) { globalAlpha = value; },
    get lineWidth() { return lineWidth; },
    set lineWidth(value: number) { lineWidth = value; },
    get lineCap() { return lineCap; },
    set lineCap(value: CanvasLineCap) { lineCap = value; },
    save() {
      trace.saves++;
      trace.operations.push('save');
      stack.push({ fillStyle, strokeStyle, globalAlpha, lineWidth, lineCap });
    },
    restore() {
      trace.restores++;
      trace.operations.push('restore');
      const saved = stack.pop();
      if (saved) {
        ({ fillStyle, strokeStyle, globalAlpha, lineWidth, lineCap } = saved);
      }
    },
    translate() { trace.operations.push('translate'); },
    rotate(angle: number) { trace.rotations.push(angle); trace.operations.push('rotate'); },
    beginPath() { trace.operations.push('beginPath'); },
    closePath() { trace.operations.push('closePath'); },
    moveTo() { trace.operations.push('moveTo'); },
    lineTo() { trace.operations.push('lineTo'); },
    bezierCurveTo() { trace.operations.push('bezierCurveTo'); },
    ellipse() { trace.operations.push('ellipse'); },
    arc(x: number, y: number, radius: number) {
      trace.arcs.push(radius);
      trace.arcCalls.push({ x, y, radius, alpha: globalAlpha, fill: fillStyle });
      trace.operations.push('arc');
    },
    fill() { trace.operations.push('fill'); },
    stroke() { trace.operations.push('stroke'); },
    fillRect() { trace.operations.push('fillRect'); },
    createRadialGradient() {
      trace.operations.push('createRadialGradient');
      return {
        addColorStop(_offset: number, color: string) {
          trace.fills.push(color);
        },
      };
    },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, trace };
}

function projectile(
  weaponType: WeaponType,
  overrides: Partial<ProjectileState> = {},
): ProjectileState {
  return {
    x: 100,
    y: 90,
    vx: 4,
    vy: -3,
    weaponType,
    age: 10,
    hasSplit: false,
    bounces: 0,
    ...overrides,
  };
}

function drawTwice(weaponType: WeaponType): CanvasTrace {
  const renderer = new ProjectileRenderer();
  const { ctx, trace } = tracingContext();
  renderer.draw(ctx, [projectile(weaponType)]);
  renderer.draw(ctx, [projectile(weaponType, { x: 104, y: 87 })]);
  return trace;
}

function countOperation(trace: CanvasTrace, operation: string): number {
  return trace.operations.filter((candidate) => candidate === operation).length;
}

describe('ProjectileRenderer weapon signatures', () => {
  it('uses the weapon accent and profile radii for both shell and history trail', () => {
    const baby = drawTwice('baby_missile');
    const nuke = drawTwice('nuke');

    expect(baby.fills).toContain('#ffb347');
    expect(nuke.fills).toContain('#fff7c2');
    expect(baby.arcs).toContain(5);
    expect(baby.arcs).toContain(9);
    expect(nuke.arcs).toContain(7.5);
    expect(nuke.arcs).toContain(18);
  });

  it('draws distinct Canvas silhouettes for every major projectile family', () => {
    const heavy = drawTwice('heavy_missile');
    const nuclear = drawTwice('nuke');
    const earth = drawTwice('dirt_bomb');
    const napalm = drawTwice('napalm');
    const mine = drawTwice('bouncing_betty');
    const airburst = drawTwice('cluster_bomb');

    expect({
      ellipse: countOperation(heavy, 'ellipse'),
      fillRect: countOperation(heavy, 'fillRect'),
      stroke: countOperation(heavy, 'stroke'),
      closePath: countOperation(heavy, 'closePath'),
    }).toEqual({ ellipse: 2, fillRect: 2, stroke: 0, closePath: 0 });
    expect({
      ellipse: countOperation(nuclear, 'ellipse'),
      fillRect: countOperation(nuclear, 'fillRect'),
      stroke: countOperation(nuclear, 'stroke'),
      closePath: countOperation(nuclear, 'closePath'),
    }).toEqual({ ellipse: 0, fillRect: 0, stroke: 2, closePath: 0 });
    expect({
      lineTo: countOperation(earth, 'lineTo'),
      closePath: countOperation(earth, 'closePath'),
      stroke: countOperation(earth, 'stroke'),
      bezierCurveTo: countOperation(earth, 'bezierCurveTo'),
    }).toEqual({ lineTo: 8, closePath: 2, stroke: 0, bezierCurveTo: 0 });
    expect({
      lineTo: countOperation(napalm, 'lineTo'),
      closePath: countOperation(napalm, 'closePath'),
      stroke: countOperation(napalm, 'stroke'),
      bezierCurveTo: countOperation(napalm, 'bezierCurveTo'),
    }).toEqual({ lineTo: 0, closePath: 2, stroke: 0, bezierCurveTo: 4 });
    expect({
      lineTo: countOperation(mine, 'lineTo'),
      closePath: countOperation(mine, 'closePath'),
      stroke: countOperation(mine, 'stroke'),
      bezierCurveTo: countOperation(mine, 'bezierCurveTo'),
    }).toEqual({ lineTo: 4, closePath: 0, stroke: 2, bezierCurveTo: 0 });
    expect({
      lineTo: countOperation(airburst, 'lineTo'),
      fillRect: countOperation(airburst, 'fillRect'),
      stroke: countOperation(airburst, 'stroke'),
      closePath: countOperation(airburst, 'closePath'),
    }).toEqual({ lineTo: 6, fillRect: 2, stroke: 0, closePath: 2 });
  });

  it('draws split airburst children smaller with their own finned silhouette', () => {
    const renderer = new ProjectileRenderer();
    const parentContext = tracingContext();
    const childContext = tracingContext();

    renderer.draw(parentContext.ctx, [projectile('mirv')]);
    renderer.draw(childContext.ctx, [projectile('mirv', { hasSplit: true })]);

    expect(parentContext.trace.operations).toContain('closePath');
    expect(childContext.trace.operations).not.toContain('closePath');
    expect(childContext.trace.operations).toContain('stroke');
    // The real split is co-located: semantic identity, not distance, must reset
    // slot 0 so the child does not repaint the carrier's trail.
    expect(childContext.trace.arcs).toHaveLength(2);
    expect(Math.max(...childContext.trace.arcs)).toBeLessThan(
      Math.max(...parentContext.trace.arcs),
    );
  });

  it('orients silhouettes along velocity and balances Canvas state', () => {
    const renderer = new ProjectileRenderer();
    const { ctx, trace } = tracingContext();
    ctx.fillStyle = 'sentinel-fill';
    ctx.strokeStyle = 'sentinel-stroke';
    ctx.globalAlpha = 0.37;
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';

    renderer.draw(ctx, [projectile('napalm', { vx: 0, vy: 5 })]);

    expect(trace.rotations).toContain(Math.PI / 2);
    expect(trace.saves).toBeGreaterThan(0);
    expect(trace.saves).toBe(trace.restores);
    expect(ctx.fillStyle).toBe('sentinel-fill');
    expect(ctx.strokeStyle).toBe('sentinel-stroke');
    expect(ctx.globalAlpha).toBe(0.37);
    expect(ctx.lineWidth).toBe(7);
    expect(ctx.lineCap).toBe('square');
  });

  it('draws trail before halo before silhouette and wires both interpolation endpoints', () => {
    const renderer = new ProjectileRenderer();
    renderer.draw(tracingContext().ctx, [projectile('hot_napalm', { x: 100, age: 1 })]);
    renderer.draw(tracingContext().ctx, [projectile('hot_napalm', { x: 104, age: 2 })]);
    const { ctx, trace } = tracingContext();

    renderer.draw(ctx, [projectile('hot_napalm', { x: 108, age: 3 })]);

    expect(trace.arcCalls.slice(0, 2)).toEqual([
      { x: 100, y: 90, radius: 7, alpha: 0.1, fill: '#ff3a00' },
      { x: 104, y: 90, radius: 2.3, alpha: 0.52, fill: '#ff3a00' },
    ]);
    const trailArc = trace.operations.indexOf('arc');
    const halo = trace.operations.indexOf('createRadialGradient');
    const silhouette = trace.operations.indexOf('translate');
    expect(trailArc).toBeLessThan(halo);
    expect(halo).toBeLessThan(silhouette);
  });

  it('wires each major family trail profile through the Canvas seam', () => {
    const signatures = new Set<string>();
    for (const weaponType of [
      'heavy_missile',
      'dirt_bomb',
      'napalm',
      'bouncing_betty',
      'cluster_bomb',
    ] as const) {
      const renderer = new ProjectileRenderer();
      renderer.draw(tracingContext().ctx, [projectile(weaponType, { x: 100, age: 1 })]);
      renderer.draw(tracingContext().ctx, [projectile(weaponType, { x: 104, age: 2 })]);
      const frame = tracingContext();
      renderer.draw(frame.ctx, [projectile(weaponType, { x: 108, age: 3 })]);
      const profile = getProjectileVisualProfile(projectile(weaponType));
      const trail = frame.trace.arcCalls.slice(0, 2).map((call) => ({
        radius: call.radius,
        alpha: call.alpha,
        fill: call.fill,
      }));

      expect(trail[0].fill).toBe(profile.accent);
      expect(trail[0].radius).toBeCloseTo(profile.trailRadiusMax);
      expect(trail[0].alpha).toBeCloseTo(profile.trailAlphaOld);
      expect(trail[1].fill).toBe(profile.accent);
      expect(trail[1].radius).toBeCloseTo(profile.trailRadiusMin);
      expect(trail[1].alpha).toBeCloseTo(profile.trailAlphaNew);
      signatures.add(JSON.stringify(trail.map((entry) => ({
        ...entry,
        radius: entry.radius.toFixed(3),
        alpha: entry.alpha.toFixed(3),
      }))));
    }
    expect(signatures.size).toBe(5);
  });

  it('keeps exactly 30 history samples and honors the 100px discontinuity boundary', () => {
    const capacityRenderer = new ProjectileRenderer();
    for (let age = 0; age < 30; age++) {
      capacityRenderer.draw(
        tracingContext().ctx,
        [projectile('baby_missile', { x: 100 + age, age })],
      );
    }
    const capacityFrame = tracingContext();
    capacityRenderer.draw(
      capacityFrame.ctx,
      [projectile('baby_missile', { x: 130, age: 30 })],
    );
    // 29 retained trail puffs + one halo; the shell itself is an ellipse.
    expect(capacityFrame.trace.arcs).toHaveLength(30);

    const boundaryRenderer = new ProjectileRenderer();
    boundaryRenderer.draw(
      tracingContext().ctx,
      [projectile('baby_missile', { x: 0, y: 0, age: 0 })],
    );
    const exactBoundary = tracingContext();
    boundaryRenderer.draw(
      exactBoundary.ctx,
      [projectile('baby_missile', { x: 100, y: 0, age: 1 })],
    );
    expect(exactBoundary.trace.arcs).toHaveLength(2);

    const beyondBoundary = tracingContext();
    boundaryRenderer.draw(
      beyondBoundary.ctx,
      [projectile('baby_missile', { x: 200.01, y: 0, age: 2 })],
    );
    expect(beyondBoundary.trace.arcs).toHaveLength(1);
  });

  it('resets all histories when split children compact or the live count changes', () => {
    const renderer = new ProjectileRenderer();
    const children = [
      projectile('mirv', { x: 100, hasSplit: true, age: 1 }),
      projectile('mirv', { x: 150, hasSplit: true, age: 1 }),
    ];
    renderer.draw(tracingContext().ctx, children);
    renderer.draw(tracingContext().ctx, [
      { ...children[0], x: 104, age: 2 },
      { ...children[1], x: 154, age: 2 },
    ]);

    const compacted = tracingContext();
    renderer.draw(compacted.ctx, [{ ...children[1], x: 158, age: 3 }]);
    expect(compacted.trace.arcs).toHaveLength(2);

    const regrown = tracingContext();
    renderer.draw(regrown.ctx, [
      { ...children[1], x: 162, age: 4 },
      projectile('mirv', { x: 200, hasSplit: true, age: 1 }),
    ]);
    // Both children have only halo + core after count 1 -> 2.
    expect(regrown.trace.arcs).toHaveLength(4);
  });

  it('retains identity, discontinuity, and clear semantics without mutating state', () => {
    const renderer = new ProjectileRenderer();
    const state = projectile('baby_missile');
    const before = { ...state };

    renderer.draw(tracingContext().ctx, [state]);
    renderer.draw(tracingContext().ctx, [{ ...state, x: 4, age: 1 }]);

    const weaponChanged = tracingContext();
    renderer.draw(weaponChanged.ctx, [projectile('missile', { x: 8, age: 2 })]);
    expect(weaponChanged.trace.arcs).toHaveLength(1);

    renderer.draw(tracingContext().ctx, [projectile('missile', { x: 12, age: 3 })]);
    const ageRewound = tracingContext();
    renderer.draw(ageRewound.ctx, [projectile('missile', { x: 16, age: 0 })]);
    expect(ageRewound.trace.arcs).toHaveLength(1);

    renderer.clear();
    const afterClear = tracingContext();
    renderer.draw(afterClear.ctx, [{ ...state, x: 20 }]);
    expect(afterClear.trace.arcs).toHaveLength(1);
    expect(state).toEqual(before);
  });
});

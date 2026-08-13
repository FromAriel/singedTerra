import { describe, expect, it } from 'vitest';
import { PLAYABLE_DIRECT_IDS } from '@shared/content/PlayableDirectBridge';
import { getComposableContent } from '@shared/content/ComposableCatalog';
import { GameEngine } from '@shared/engine/GameEngine';
import { weaponRegistry as registry } from '@shared/weapons/registry';
import { ApocalypseEngine } from '../apocalypse/ApocalypseEngine';
import { ComposedEngine } from '../apocalypse/ComposedEngine';

function makeRuntime(seed: number) {
  const core = new GameEngine({ seed, maxPlayers: 2, players: [
    { name: 'Alpha', color: '#ff5577' },
    { name: 'Beta', color: '#55ccff' },
  ] });
  const outer = new ApocalypseEngine(core, seed);
  return { core, outer, composed: new ComposedEngine(core, outer, true) };
}

function step(runtime: ReturnType<typeof makeRuntime>): void {
  runtime.composed.prepareTick();
  runtime.outer.tick();
  runtime.composed.observe();
}

function settle(runtime: ReturnType<typeof makeRuntime>): number {
  let ticks = 0;
  while (
    ticks < 800
    && (runtime.composed.isActive() || ['FIRING', 'RESOLVING'].includes(runtime.core.getState().phase))
  ) {
    step(runtime);
    ticks++;
  }
  return ticks;
}

function clearLane(runtime: ReturnType<typeof makeRuntime>): void {
  const state = runtime.core.getState();
  state.terrain.fill(0);
  state.walls = 'open';
  const shooter = state.tanks[0]!;
  const target = state.tanks[1]!;
  state.activePlayerId = shooter.id;
  shooter.x = 200;
  shooter.y = 300;
  shooter.angle = 0;
  shooter.power = 100;
  shooter.powerCap = 100;
  target.x = 430;
  target.y = 286;
  target.health = 100;
  target.alive = true;
  target.shieldHp = 0;
}

function byteHash(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul((hash ^ byte) >>> 0, 0x01000193) >>> 0;
  return hash;
}

describe('composed game bridge', () => {
  it('runs every first-batch entry through its complete authored sequence', () => {
    expect(PLAYABLE_DIRECT_IDS).toHaveLength(10);
    for (const id of PLAYABLE_DIRECT_IDS) {
      const runtime = makeRuntime(0x9001);
      const entry = registry.require(id);
      expect(entry.execution.kind).toBe('composed');
      if (entry.execution.kind !== 'composed') continue;
      const profile = getComposableContent(entry.execution.modifiers?.[0] ?? '');
      expect(profile).toBeDefined();
      expect(runtime.composed.fire(id)).toBe(true);
      expect(runtime.composed.getFxSnapshot()).toMatchObject({ emitted: 0, total: profile!.copies });
      expect(settle(runtime)).toBeLessThan(800);
      expect(runtime.composed.getFxSnapshot().emitted).toBe(profile!.copies);
      expect(['PLAYER_TURN', 'GAME_OVER', 'ROUND_OVER']).toContain(runtime.core.getState().phase);
    }
  });

  it('releases the machine gun as a true one-per-tick burst instead of a fan', () => {
    const runtime = makeRuntime(0x11112222);
    clearLane(runtime);
    runtime.core.getState().tanks[1]!.y = 100;
    expect(runtime.composed.fire('direct.machine_gun')).toBe(true);

    const emitted: number[] = [];
    const headings: number[] = [];
    for (let i = 0; i < 5; i++) {
      step(runtime);
      const fx = runtime.composed.getFxSnapshot();
      emitted.push(fx.emitted);
      headings.push(...fx.streaks.map((streak) => Math.atan2(streak.vy, streak.vx)));
    }

    expect(emitted).toEqual([1, 2, 3, 4, 5]);
    expect(headings.length).toBeGreaterThan(0);
    expect(Math.max(...headings) - Math.min(...headings)).toBeLessThan(1e-9);
  });

  it('releases the scattergun as a short expanding packet', () => {
    const runtime = makeRuntime(0x33334444);
    clearLane(runtime);
    runtime.core.getState().tanks[1]!.y = 100;
    expect(runtime.composed.fire('direct.scattergun')).toBe(true);

    step(runtime);
    const first = runtime.composed.getFxSnapshot();
    step(runtime);
    const second = runtime.composed.getFxSnapshot();
    step(runtime);
    const third = runtime.composed.getFxSnapshot();

    expect([first.emitted, second.emitted, third.emitted]).toEqual([3, 6, 9]);
    const headings = third.streaks.map((streak) => Math.atan2(streak.vy, streak.vx));
    expect(Math.max(...headings) - Math.min(...headings)).toBeGreaterThan(0.1);
  });

  it('keeps direct-fire velocity linear across fixed ticks', () => {
    const runtime = makeRuntime(0x55556666);
    clearLane(runtime);
    const state = runtime.core.getState();
    state.tanks[0]!.angle = 30;
    state.tanks[1]!.y = 50;
    expect(runtime.composed.fire('direct.service_sidearm')).toBe(true);

    step(runtime);
    const first = runtime.composed.getFxSnapshot().streaks[0]!;
    step(runtime);
    const second = runtime.composed.getFxSnapshot().streaks[0]!;

    expect(second.vx).toBeCloseTo(first.vx, 10);
    expect(second.vy).toBeCloseTo(first.vy, 10);
    expect(second.x - first.x).toBeCloseTo(second.vx, 10);
    expect(second.y - first.y).toBeCloseTo(second.vy, 10);
  });

  it('preserves terrain and exposes no explosion event after a direct tank contact', () => {
    const runtime = makeRuntime(0x77778888);
    clearLane(runtime);
    const state = runtime.core.getState();
    const terrainBefore = byteHash(state.terrain);
    const target = state.tanks[1]!;

    expect(runtime.composed.fire('direct.service_sidearm')).toBe(true);
    expect(settle(runtime)).toBeLessThan(100);

    expect(target.health).toBeLessThan(92);
    expect(byteHash(state.terrain)).toBe(terrainBefore);
    expect(state.explosions).toEqual([]);
    expect(state.lastExplosion).toBeNull();
  });

  it('permits one reflective side-wall bounce and then resolves the next crossing', () => {
    const runtime = makeRuntime(0x9999aaaa);
    clearLane(runtime);
    const state = runtime.core.getState();
    const shooter = state.tanks[0]!;
    state.walls = 'reflective';
    shooter.x = 80;
    shooter.angle = 180;
    state.tanks[1]!.x = 900;
    state.tanks[1]!.y = 100;

    expect(runtime.composed.fire('direct.service_sidearm')).toBe(true);
    let sawOutbound = false;
    let sawReturn = false;
    let ticks = 0;
    while (ticks < 140 && runtime.composed.isActive()) {
      step(runtime);
      const streak = runtime.composed.getFxSnapshot().streaks[0];
      if (streak?.vx !== undefined && streak.vx < 0) sawOutbound = true;
      if (sawOutbound && streak?.vx !== undefined && streak.vx > 0) sawReturn = true;
      ticks++;
    }

    expect(sawOutbound).toBe(true);
    expect(sawReturn).toBe(true);
    expect(ticks).toBeLessThan(140);
    expect(state.walls).toBe('reflective');
    expect(['PLAYER_TURN', 'GAME_OVER', 'ROUND_OVER']).toContain(state.phase);
  });

  it('repeats identically from the same seed', () => {
    const run = () => {
      const runtime = makeRuntime(0x12345678);
      expect(runtime.composed.fire('direct.machine_gun')).toBe(true);
      const ticks = settle(runtime);
      const state = runtime.core.getState();
      return {
        ticks,
        phase: state.phase,
        turn: state.turn,
        wind: state.wind,
        terrainHash: byteHash(state.terrain),
        tanks: state.tanks.map((tank) => [tank.id, tank.x, tank.y, tank.health, tank.alive]),
      };
    };
    expect(run()).toEqual(run());
  });
});

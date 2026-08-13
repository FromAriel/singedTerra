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

function settle(runtime: ReturnType<typeof makeRuntime>): number {
  let ticks = 0;
  while (ticks < 800 && ['FIRING', 'RESOLVING'].includes(runtime.core.getState().phase)) {
    runtime.outer.tick();
    runtime.composed.observe();
    ticks++;
  }
  return ticks;
}

describe('composed game bridge', () => {
  it('runs every first-batch entry with its authored copy count', () => {
    expect(PLAYABLE_DIRECT_IDS).toHaveLength(10);
    for (const id of PLAYABLE_DIRECT_IDS) {
      const runtime = makeRuntime(0x9001);
      const entry = registry.require(id);
      expect(entry.execution.kind).toBe('composed');
      if (entry.execution.kind !== 'composed') continue;
      const profile = getComposableContent(entry.execution.modifiers?.[0] ?? '');
      expect(profile).toBeDefined();
      expect(runtime.composed.fire(id)).toBe(true);
      expect(runtime.core.getState().projectiles).toHaveLength(profile!.copies);
      expect(settle(runtime)).toBeLessThan(800);
      expect(['PLAYER_TURN', 'GAME_OVER', 'ROUND_OVER']).toContain(runtime.core.getState().phase);
    }
  });

  it('repeats identically from the same seed', () => {
    const run = () => {
      const runtime = makeRuntime(0x12345678);
      expect(runtime.composed.fire('direct.machine_gun')).toBe(true);
      const ticks = settle(runtime);
      const state = runtime.core.getState();
      let terrainHash = 0x811c9dc5;
      for (const byte of state.terrain) terrainHash = Math.imul((terrainHash ^ byte) >>> 0, 0x01000193) >>> 0;
      return {
        ticks,
        phase: state.phase,
        turn: state.turn,
        wind: state.wind,
        terrainHash,
        tanks: state.tanks.map((tank) => [tank.id, tank.x, tank.y, tank.health, tank.alive]),
      };
    };
    expect(run()).toEqual(run());
  });
});

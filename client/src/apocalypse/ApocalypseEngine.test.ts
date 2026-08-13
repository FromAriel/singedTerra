import { describe, expect, it } from 'vitest';
import { GameEngine } from '@shared/engine/GameEngine';
import { ApocalypseEngine, GOD_WEAPONS } from './ApocalypseEngine';

function make(seed = 12345): ApocalypseEngine {
  const core = new GameEngine({ maxPlayers: 2, seed, walls: 'reflective' });
  return new ApocalypseEngine(core, seed);
}

function terrainChecksum(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 97) {
    hash ^= bytes[i] ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

describe('ApocalypseEngine', () => {
  it('ships every god weapon with a usable starting charge', () => {
    const apocalypse = make();
    const tankId = apocalypse.getState().activePlayerId;
    const charges = apocalypse.getCharges(tankId);
    for (const def of Object.values(GOD_WEAPONS)) {
      expect(def.startingCharges).toBeGreaterThan(0);
      expect(charges[def.type]).toBe(def.startingCharges);
    }
  });

  it('resolves Rift Lance as a deterministic turn-ending sidecar action', () => {
    const a = make(9001);
    const b = make(9001);

    expect(a.fireSpecial('rift_lance')).toBe(true);
    expect(b.fireSpecial('rift_lance')).toBe(true);

    for (let i = 0; i < 80; i++) {
      a.tick();
      b.tick();
    }

    const sa = a.getState();
    const sb = b.getState();
    expect(sa.phase).toBe(sb.phase);
    expect(sa.activePlayerId).toBe(sb.activePlayerId);
    expect(sa.turn).toBe(sb.turn);
    expect(sa.wind).toBe(sb.wind);
    expect(terrainChecksum(sa.terrain)).toBe(terrainChecksum(sb.terrain));
    expect(sa.tanks.map((tank) => [tank.x, tank.y, tank.health, tank.alive]))
      .toEqual(sb.tanks.map((tank) => [tank.x, tank.y, tank.health, tank.alive]));
  });

  it('records accepted canonical and exotic actions in the exported sidecar log', () => {
    const apocalypse = make(77);
    expect(apocalypse.applyAction({ type: 'set_angle', angle: 63 })).toBe(true);
    expect(apocalypse.applyAction({ type: 'set_power', power: 71 })).toBe(true);
    expect(apocalypse.fireSpecial('chrono_echo')).toBe(true);

    const replay = JSON.parse(apocalypse.exportReplay()) as {
      format: string;
      seed: number;
      actions: Array<{ kind: string; weapon?: string }>;
    };
    expect(replay.format).toBe('singedTerra-apocalypse-replay');
    expect(replay.seed).toBe(77);
    expect(replay.actions.map((entry) => entry.kind)).toEqual([
      'core_action',
      'core_action',
      'god_fire',
    ]);
    expect(replay.actions.at(-1)?.weapon).toBe('chrono_echo');
  });

  it('never allows a special purchase the active tank cannot afford', () => {
    const apocalypse = make();
    const tank = apocalypse.getState().tanks.find((candidate) => candidate.id === apocalypse.getState().activePlayerId);
    expect(tank).toBeDefined();
    if (!tank) return;
    tank.credits = 0;
    const before = apocalypse.getCharges(tank.id).planetcracker;
    expect(apocalypse.buySpecial('planetcracker')).toBe(false);
    expect(apocalypse.getCharges(tank.id).planetcracker).toBe(before);
  });
});

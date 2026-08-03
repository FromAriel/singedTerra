// Deterministic tracer weapon contract.
// RED first: this harness must fail until the shared weapon and engine semantics exist.

import { GameEngine } from '../../shared/src/engine/GameEngine.ts';
import { replayNetworkAction } from '../../shared/src/net/replay.ts';
import { TURN_STIPEND } from '../../shared/src/engine/WeaponSystem.ts';

const SEED = 0x7ace1234;
const MAX_TICKS = 100_000;
let failed = false;

function check(condition, message) {
  if (!condition) {
    failed = true;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function tickToRest(engine) {
  let ticks = 0;
  while ((engine.getState().phase === 'FIRING' || engine.getState().phase === 'RESOLVING') && ticks < MAX_TICKS) {
    engine.tick();
    ticks += 1;
  }
  check(ticks < MAX_TICKS, 'tracer resolves within the bounded flight cap');
}

function fireTracer(engine) {
  engine.applyAction({ type: 'select_weapon', weapon: 'tracer' });
  engine.applyAction({ type: 'set_angle', angle: 45 });
  engine.applyAction({ type: 'set_power', power: 50 });
  engine.applyAction({ type: 'fire' });
  tickToRest(engine);
}

const live = new GameEngine({ seed: SEED });
const before = live.getState();
const terrainBefore = before.terrain.slice();
const healthBefore = before.tanks.map((tank) => tank.health);
const creditsBefore = before.tanks.map((tank) => tank.credits);
const versionBefore = before.terrainVersion;

const tracerSlot = before.tanks[0].inventory.tracer;
check(tracerSlot?.count === 1, 'fresh tanks receive one tracer round');
if (!tracerSlot) {
  console.error('RED: tracer inventory slot is not implemented yet');
  process.exit(1);
}
fireTracer(live);
const after = live.getState();
check(after.tanks[0].inventory.tracer.count === 0, 'tracer fire consumes exactly one round');
check(after.phase === 'PLAYER_TURN', 'tracer remains a turn-ending fire action');
check(after.terrainVersion === versionBefore, 'tracer impact does not dirty terrain');
check(Buffer.from(after.terrain).equals(Buffer.from(terrainBefore)), 'tracer impact preserves terrain bytes');
check(after.tanks.every((tank, i) => tank.health === healthBefore[i]), 'tracer impact deals no tank damage');
check(after.tanks[0].credits === creditsBefore[0] + TURN_STIPEND, 'tracer preserves the ordinary turn stipend without damage credits');
check(after.tanks.slice(1).every((tank, i) => tank.credits === creditsBefore[i + 1]), 'tracer awards no credits to non-shooters');
check(after.fire.length === 0, 'tracer impact does not create a fire field');
check(after.explosions.some((event) => event.weaponType === 'tracer' && event.color === '#55e6ff'), 'tracer emits its cyan impact marker');

const replay = new GameEngine({ seed: SEED });
replayNetworkAction(replay, { type: 'fire', angle: 45, power: 50, weapon: 'tracer' });
tickToRest(replay);
const replayState = replay.getState();
check(JSON.stringify({
  phase: replayState.phase,
  terrain: Array.from(replayState.terrain),
  tanks: replayState.tanks.map((tank) => ({ health: tank.health, credits: tank.credits, inventory: tank.inventory })),
  explosions: replayState.explosions,
}) === JSON.stringify({
  phase: after.phase,
  terrain: Array.from(after.terrain),
  tanks: after.tanks.map((tank) => ({ health: tank.health, credits: tank.credits, inventory: tank.inventory })),
  explosions: after.explosions,
}), 'logged tracer fire replays to the same deterministic state');

const empty = new GameEngine({ seed: SEED });
empty.getState().tanks[0].inventory.tracer.count = 0;
empty.applyAction({ type: 'select_weapon', weapon: 'tracer' });
const emptyBefore = JSON.stringify(empty.getState());
empty.applyAction({ type: 'fire' });
check(JSON.stringify(empty.getState()) === emptyBefore, 'empty tracer inventory rejects a second shot without mutation');

if (failed) process.exit(1);

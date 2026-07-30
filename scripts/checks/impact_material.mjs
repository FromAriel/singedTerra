/**
 * Authoritative impact-material contract.
 *
 * Synthetic projectiles enter the real GameEngine tick and swept-collision
 * path. The harness changes no production geometry or damage tuning.
 */
import { GameEngine } from '../../shared/src/engine/GameEngine.ts';
import { surfaceAt } from '../../shared/src/engine/Terrain.ts';
import { TANK_HEIGHT } from '../../shared/src/engine/Tank.ts';

let passed = 0;
let failed = 0;

function check(condition, label, detail = '') {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.error(`FAIL: ${label}${detail ? ` (${detail})` : ''}`);
  }
}

function projectile(overrides) {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    weaponType: 'missile',
    age: 8,
    hasSplit: true,
    bounces: 0,
    ...overrides,
  };
}

function tickProjectile(p) {
  const engine = new GameEngine({ seed: 0x1a2b3c4d });
  const state = engine.getState();
  state.phase = 'FIRING';
  state.explosions = [];
  state.lastExplosion = null;
  state.projectiles = [p];
  state.projectile = p;
  engine.tick();
  return state;
}

{
  const probe = new GameEngine({ seed: 0x1a2b3c4d }).getState();
  const target = probe.tanks[1];
  const state = tickProjectile(projectile({
    x: target.x - 24,
    y: target.y - TANK_HEIGHT / 2,
    vx: 30,
  }));
  check(state.explosions.length === 1, 'direct missile produced one event');
  check(
    state.explosions[0]?.impactType === 'tank',
    'swept direct missile reports tank material',
    `got ${state.explosions[0]?.impactType}`,
  );
}

{
  const probe = new GameEngine({ seed: 0x1a2b3c4d }).getState();
  const x = Math.round((probe.tanks[0].x + probe.tanks[1].x) / 2);
  const groundY = surfaceAt(probe.terrain, x);
  const state = tickProjectile(projectile({
    x,
    y: groundY - 24,
    vy: 30,
  }));
  check(state.explosions.length === 1, 'ground missile produced one event');
  check(
    state.explosions[0]?.impactType === 'ground',
    'swept ground missile reports ground material',
    `got ${state.explosions[0]?.impactType}`,
  );
}

{
  const probe = new GameEngine({ seed: 0x1a2b3c4d }).getState();
  const target = probe.tanks[1];
  const state = tickProjectile(projectile({
    x: target.x - 24,
    y: target.y - TANK_HEIGHT / 2,
    vx: 30,
    weaponType: 'napalm',
  }));
  check(state.explosions.length === 1, 'direct napalm ignition produced one event');
  check(
    state.explosions[0]?.impactType === 'tank',
    'direct napalm ignition preserves tank material',
    `got ${state.explosions[0]?.impactType}`,
  );
}

{
  const probe = new GameEngine({ seed: 0x1a2b3c4d }).getState();
  const x = Math.round((probe.tanks[0].x + probe.tanks[1].x) / 2);
  const groundY = surfaceAt(probe.terrain, x);
  const state = tickProjectile(projectile({
    x,
    y: groundY - 24,
    vy: 30,
    weaponType: 'bouncing_betty',
    bounces: 1,
  }));
  check(state.explosions.length === 1, 'betty contact produced one event');
  check(
    state.explosions[0]?.impactType === 'ground',
    'betty contact blast preserves ground material',
    `got ${state.explosions[0]?.impactType}`,
  );
}

{
  const state = tickProjectile(projectile({
    x: 600,
    y: 60,
    age: 239,
  }));
  check(state.explosions.length === 1, 'flight-cap detonation produced one event');
  check(
    state.explosions[0]?.impactType === undefined
      && !Object.hasOwn(state.explosions[0] ?? {}, 'impactType'),
    'air detonation does not invent impact material',
    `got ${state.explosions[0]?.impactType}`,
  );
}

if (failed > 0) {
  console.error(`\nIMPACT MATERIAL CHECK: ${passed} passed, ${failed} failed`);
  process.exit(1);
}
console.log(`\nIMPACT MATERIAL CHECK: PASSED (${passed} assertions)`);

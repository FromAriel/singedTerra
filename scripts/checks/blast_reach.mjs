// BLAST-REACH contract: one shared geometry rule must drive authoritative damage
// and the client-only fireball, while terrain remains the weapon's base-radius disc.
import {
  BLAST_REACH,
  CLUSTER_REACH,
  blastReach,
  blastReachRadius,
} from '../../shared/src/engine/BlastGeometry.ts';
import { GameEngine } from '../../shared/src/engine/GameEngine.ts';
import { CANVAS_WIDTH } from '../../shared/src/engine/Terrain.ts';
import { getWeapon } from '../../shared/src/engine/WeaponSystem.ts';
import { TANK_HEIGHT } from '../../shared/src/engine/Tank.ts';
import fs from 'node:fs';

let failed = false;
const fail = (message) => { failed = true; console.log(`FAIL: ${message}`); };
const check = (condition, message) => {
  if (!condition) fail(message);
  else console.log(`OK: ${message}`);
};
const close = (actual, expected, message) =>
  check(Math.abs(actual - expected) < 1e-8, `${message}; got ${actual}, expected ${expected}`);

check(BLAST_REACH === 1.8, 'BLAST_REACH is 1.8');
check(CLUSTER_REACH === 1.4, 'CLUSTER_REACH is 1.4');
check(blastReach('blast') === BLAST_REACH, 'blast style uses BLAST_REACH');
check(blastReach('cluster') === CLUSTER_REACH, 'cluster style uses CLUSTER_REACH');
check(blastReachRadius(30, 'blast') === 54, 'blast reach radius is 54');
check(blastReachRadius(30, 'cluster') === 42, 'cluster reach radius is 42');
check(blastReachRadius(-1, 'blast') === 0, 'negative base radius is clamped to zero');

function detonateWithTarget(weaponType, distance) {
  const engine = new GameEngine({ seed: 17 });
  const state = engine.getState();
  const target = state.tanks[1];
  const cx = 600;
  const cy = 300;
  target.x = cx + distance;
  target.y = cy + TANK_HEIGHT / 2;
  target.health = 100;
  target.shieldHp = 0;
  state.tanks = [target];
  engine.detonate(cx, cy, weaponType);
  return { state, target, cx, cy };
}

for (const [weaponType, expectedAtBase, expectedPeak] of [
  ['missile', 26.6666666667, 60],
  ['mirv', 14.2857142857, 50],
]) {
  const { radius, style } = getWeapon(weaponType).detonation;
  const atBase = detonateWithTarget(weaponType, radius).target;
  close(100 - atBase.health, expectedAtBase, `${weaponType} damages at its base-radius edge`);

  const atVisibleEdge = detonateWithTarget(weaponType, blastReachRadius(radius, style)).target;
  close(100 - atVisibleEdge.health, 0, `${weaponType} does not damage at its visible edge`);

  const atCenter = detonateWithTarget(weaponType, 0).target;
  close(100 - atCenter.health, expectedPeak, `${weaponType} keeps its original center peak`);
}

for (const weaponType of ['dirt_bomb', 'riot_bomb', 'shield']) {
  const { radius, style } = getWeapon(weaponType).detonation;
  const target = detonateWithTarget(weaponType, 0).target;
  close(100 - target.health, 0, `${weaponType} has no direct impact damage at center`);
}

function igniteNapalmAtTarget(weaponType) {
  const engine = new GameEngine({ seed: 17 });
  const state = engine.getState();
  const target = state.tanks[1];
  const cx = 600;
  const cy = 300;
  target.x = cx;
  target.y = cy + TANK_HEIGHT / 2;
  target.health = 100;
  target.shieldHp = 0;
  state.tanks = [target];
  state.projectiles = [{
    x: cx,
    y: cy,
    vx: 0,
    vy: 0,
    weaponType,
    age: 0,
    hasSplit: false,
    bounces: 0,
  }];
  engine.advanceProjectiles();
  return { state, target };
}

for (const weaponType of ['napalm', 'hot_napalm']) {
  const { state, target } = igniteNapalmAtTarget(weaponType);
  close(100 - target.health, 0, `${weaponType} actual impact path causes zero immediate damage`);
  check(state.fire.length > 0, `${weaponType} actual impact path ignites a fire field`);
}

{
  const engine = new GameEngine({ seed: 17 });
  const state = engine.getState();
  const before = state.terrain.slice();
  const cx = 600;
  const cy = 300;
  const radius = getWeapon('missile').detonation.radius;
  engine.detonate(cx, cy, 'missile');
  let outsideUnchanged = true;
  for (let y = 0; y < state.terrain.length / CANVAS_WIDTH; y++) {
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      if (Math.hypot(x - cx, y - cy) > radius && before[y * CANVAS_WIDTH + x] !== state.terrain[y * CANVAS_WIDTH + x]) {
        outsideUnchanged = false;
      }
    }
  }
  check(outsideUnchanged, 'terrain bytes outside the base crater disc remain unchanged');
}

const engineSource = fs.readFileSync(new URL('../../shared/src/engine/GameEngine.ts', import.meta.url), 'utf8');
const rendererSource = fs.readFileSync(new URL('../../client/src/renderer/Renderer.ts', import.meta.url), 'utf8');
check(/import\s*\{\s*blastReachRadius\s*\}/.test(engineSource), 'GameEngine imports blastReachRadius');
check(/explosionDamage\(cx, cy, damageRadius, tank\)/.test(engineSource), 'GameEngine calls blastReachRadius-derived damage radius');
check(/import\s*\{\s*blastReachRadius\s*\}/.test(rendererSource), 'Renderer imports blastReachRadius');
check(/blastReachRadius\(b\.radius, b\.style\) \* grow/.test(rendererSource), 'Renderer calls shared blast reach radius');
check(!/(b\.radius\s*\*\s*(?:1\.8|1\.4)|\?\s*1\.4\s*:\s*1\.8)/.test(rendererSource), 'Renderer no longer owns blast reach literals');

if (failed) {
  console.log('\nBLAST REACH CHECK: FAILED');
  process.exit(1);
}
console.log('\nBLAST REACH CHECK: PASSED');

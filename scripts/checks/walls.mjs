/**
 * Reflective sidewall contract through the real engine and AI simulation paths.
 */
import { GameEngine } from '../../shared/src/engine/GameEngine.ts';
import { simulateImpact } from '../../shared/src/engine/AiShotSearch.ts';
import { CANVAS_WIDTH } from '../../shared/src/engine/Terrain.ts';
import { MAX_FLIGHT_TICKS } from '../../shared/src/engine/Physics.ts';

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

function projectile(overrides = {}) {
  return {
    x: 1,
    y: 80,
    vx: -4,
    vy: 0,
    weaponType: 'missile',
    age: 8,
    hasSplit: true,
    bounces: 0,
    ...overrides,
  };
}

function engineWith(walls, p) {
  const engine = new GameEngine({ seed: 0x51de, walls });
  const state = engine.getState();
  state.phase = 'FIRING';
  state.wind = 0;
  state.explosions = [];
  state.lastExplosion = null;
  state.projectiles = [p];
  state.projectile = p;
  return { engine, state };
}

{
  const shot = projectile();
  const { engine, state } = engineWith('open', shot);
  engine.tick();
  check(state.projectiles.length === 0, 'open sidewall keeps the legacy OOB miss');
  check((state.wallImpacts ?? []).length === 0, 'open miss emits no wall contact');
}

{
  const shot = projectile();
  const { engine, state } = engineWith('reflective', shot);
  engine.tick();
  check(state.projectiles.length === 1, 'left rail keeps the shot in flight');
  check(shot.x > 0 && shot.x < CANVAS_WIDTH, 'left rail snaps the shot inside', `x=${shot.x}`);
  check(shot.vx > 0, 'left rail reflects horizontal velocity', `vx=${shot.vx}`);
  check(state.wallImpacts?.[0]?.side === 'left', 'left rail emits an authoritative contact');
}

{
  const shot = projectile({ x: CANVAS_WIDTH - 1, vx: 4 });
  const { engine, state } = engineWith('reflective', shot);
  engine.tick();
  check(state.projectiles.length === 1, 'right rail keeps the shot in flight');
  check(shot.x > 0 && shot.x < CANVAS_WIDTH, 'right rail snaps the shot inside', `x=${shot.x}`);
  check(shot.vx < 0, 'right rail reflects horizontal velocity', `vx=${shot.vx}`);
  check(state.wallImpacts?.[0]?.side === 'right', 'right rail emits an authoritative contact');
}

{
  function trace() {
    const shot = projectile({ x: CANVAS_WIDTH / 2, vx: 18, vy: -8 });
    const { engine, state } = engineWith('reflective', shot);
    for (let i = 0; i < 180 && state.phase === 'FIRING'; i++) engine.tick();
    return {
      contacts: state.wallImpacts,
      projectile: state.projectile,
      phase: state.phase,
      explosions: state.explosions,
    };
  }
  const a = trace();
  const b = trace();
  check((a.contacts?.length ?? 0) >= 2, 'one shot can bank repeatedly');
  check(JSON.stringify(a) === JSON.stringify(b), 'multi-bank trace is byte-identical');
}

{
  const shot = projectile({ age: MAX_FLIGHT_TICKS - 2 });
  const { engine, state } = engineWith('reflective', shot);
  engine.tick();
  engine.tick();
  check(state.projectiles.length === 0, 'flight cap still resolves a repeatedly banked shot');
  check(state.explosions.length === 1, 'flight cap keeps its existing air detonation');
}

{
  const actions = [
    { type: 'set_angle', angle: 150 },
    { type: 'set_power', power: 90 },
    { type: 'fire' },
  ];
  function replayBank() {
    const engine = new GameEngine({ seed: 0x51de, walls: 'reflective' });
    for (const action of actions) engine.applyAction(action);
    for (let tick = 0; tick < MAX_FLIGHT_TICKS + 20 && engine.getState().phase === 'FIRING'; tick++) {
      engine.tick();
    }
    return engine.getState();
  }
  const first = replayBank();
  const replay = replayBank();
  check(first.wallImpacts.length > 0, 'real applyAction shot banks off a reflective rail');
  check(
    JSON.stringify(first) === JSON.stringify(replay),
    'fresh-engine action replay preserves the complete banked result',
  );
}

{
  const shot = projectile();
  const { engine, state } = engineWith('reflective', shot);
  engine.tick();
  const clone = engine.clone();
  engine.tick();
  clone.tick();
  check(
    JSON.stringify(engine.getState()) === JSON.stringify(clone.getState()),
    'clone preserves wall mode, contact sequence, and future flight',
  );
  clone.getState().projectiles[0].x += 10;
  check(
    clone.getState().projectiles[0].x !== state.projectiles[0].x,
    'clone keeps reflected projectile state independent',
  );
}

{
  const engine = new GameEngine({ seed: 0x51de, walls: 'reflective' });
  const state = engine.getState();
  state.wind = 0;
  const me = { ...state.tanks[0], x: 90, angle: 150, power: 90 };
  const reflected = simulateImpact(
    { ...state, walls: 'reflective', tanks: [me] },
    me,
    me.angle,
    me.power,
    0.15,
  );
  const open = simulateImpact(
    { ...state, walls: 'open', tanks: [me] },
    me,
    me.angle,
    me.power,
    0.15,
  );
  check(open === null, 'AI open-wall probe treats the left exit as a miss');
  check(reflected !== null, 'AI reflective-wall probe follows the bank to impact');
}

{
  const engine = new GameEngine({ seed: 0x51de, walls: 'reflective', gravity: 0.05 });
  const state = engine.getState();
  state.wind = 0;
  const me = { ...state.tanks[0], x: 90, angle: 30, power: 80 };
  const predicted = simulateImpact(
    { ...state, tanks: [me] },
    me,
    me.angle,
    me.power,
    0.05,
  );

  state.tanks[0].x = me.x;
  state.tanks[0].angle = me.angle;
  state.tanks[0].power = me.power;
  engine.applyAction({ type: 'fire' });
  for (let tick = 0; tick < MAX_FLIGHT_TICKS + 20 && state.phase === 'FIRING'; tick++) {
    engine.tick();
  }
  const live = state.explosions.at(-1);
  check(live !== undefined, 'supported low-gravity bank resolves through the live engine');
  check(
    predicted !== null
      && live !== undefined
      && Math.abs(predicted.x - live.cx) < 1e-9
      && Math.abs(predicted.y - live.cy) < 1e-9,
    'AI probe scores the same 240-tick cap detonation as live execution',
    `predicted=${JSON.stringify(predicted)} live=${live ? `${live.cx},${live.cy}` : 'none'}`,
  );
}

{
  const two = new GameEngine({ seed: 0x51de }).getState().tanks;
  check(two[0].angle === 45, 'left tank starts aimed toward its opponent');
  check(two[1].angle === 135, 'right tank starts aimed toward its opponent');

  const three = new GameEngine({
    seed: 0x51de,
    players: [
      { name: 'P1', color: '#e84d4d' },
      { name: 'P2', color: '#4d8ce8' },
      { name: 'P3', color: '#4de87a' },
    ],
  }).getState().tanks;
  check(three[0].angle === 45, 'leftmost multi-seat tank aims at its nearest opponent');
  check(three[1].angle === 135, 'equidistant center tank uses deterministic left tie-break');
  check(three[2].angle === 135, 'rightmost multi-seat tank aims at its nearest opponent');
}

if (failed > 0) {
  console.error(`\nWALL CHECK: ${passed} passed, ${failed} failed`);
  process.exit(1);
}
console.log(`\nWALL CHECK: PASSED (${passed} assertions)`);

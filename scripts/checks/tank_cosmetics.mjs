import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GameEngine } from '../../shared/src/engine/GameEngine.ts';

const foundry = {
  treads: 'foundry',
  hull: 'foundry',
  turret: 'foundry',
  barrel: 'foundry',
};
const mixed = {
  treads: 'bulwark',
  hull: 'ranger',
  turret: 'foundry',
  barrel: 'ranger',
};

const options = (loadout) => ({
  maxPlayers: 2,
  seed: 0x6a726167,
  players: [
    { name: 'One', color: '#e84d4d', loadout },
    { name: 'Two', color: '#4d8ce8', loadout: foundry },
  ],
});

const baseline = new GameEngine(options(foundry));
const customized = new GameEngine(options(mixed));
for (const engine of [baseline, customized]) {
  engine.applyAction({ type: 'set_angle', angle: 38 });
  engine.applyAction({ type: 'set_power', power: 42 });
  engine.applyAction({ type: 'fire' });
  let ticks = 0;
  while (
    ['FIRING', 'RESOLVING'].includes(engine.getState().phase)
    && ticks++ < 20_000
  ) {
    engine.tick();
  }
  assert.ok(ticks < 20_000, 'scripted cosmetic parity shot must settle');
}

const withoutLoadouts = (state) => ({
  ...state,
  terrain: Buffer.from(state.terrain),
  tanks: state.tanks.map(({ loadout: _loadout, ...tank }) => tank),
});
assert.deepEqual(
  withoutLoadouts(customized.getState()),
  withoutLoadouts(baseline.getState()),
  'changing only authored parts must not affect simulation output',
);
assert.deepEqual(customized.getState().tanks[0].loadout, mixed);
assert.deepEqual(baseline.getState().tanks[0].loadout, foundry);

for (const file of [
  'Physics.ts',
  'AI.ts',
  'AiShotSearch.ts',
  'Movement.ts',
  'WeaponSystem.ts',
  'Terrain.ts',
]) {
  const source = await readFile(
    new URL(`../../shared/src/engine/${file}`, import.meta.url),
    'utf8',
  );
  assert.equal(
    source.includes('.loadout'),
    false,
    `${file} must not read cosmetic loadouts`,
  );
}

console.log('tank cosmetics: 10 assertions passed');

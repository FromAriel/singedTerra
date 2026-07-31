import { describe, expect, it } from 'vitest';
import { BARREL_LENGTH, BARREL_PIVOT_HEIGHT, barrelTip } from '@shared/engine/Tank';
import type { TankState } from '@shared/types/GameState';
import {
  DEFAULT_TANK_LOADOUT,
  TANK_KIT_IDS,
  type TankLoadout,
} from '@shared/types/TankLoadout';
import {
  DEFAULT_TANK_PART_SET,
  TANK_PART_ATLAS_HEIGHT,
  TANK_PART_SETS,
  TANK_PART_SLOTS,
  tankPartDefinition,
  tankBarrelMount,
} from './tankPartCatalog';

describe('modular tank part catalog', () => {
  it('defines one exhaustive default set with stable non-overlapping atlas cells', () => {
    expect(TANK_PART_SLOTS).toEqual([
      'treads',
      'hull',
      'turret',
      'barrel',
    ]);
    expect(Object.keys(DEFAULT_TANK_PART_SET.parts)).toEqual(TANK_PART_SLOTS);

    const cells = TANK_PART_SLOTS.map((slot) =>
      DEFAULT_TANK_PART_SET.parts[slot].source);
    expect(cells).toEqual([
      { x: 0, y: 0, width: 256, height: 128 },
      { x: 256, y: 0, width: 256, height: 128 },
      { x: 512, y: 0, width: 256, height: 128 },
      { x: 768, y: 0, width: 256, height: 128 },
    ]);
  });

  it('defines four coherent atlas rows with one compatible part per slot', () => {
    expect(TANK_PART_ATLAS_HEIGHT).toBe(512);
    expect(Object.keys(TANK_PART_SETS)).toEqual(TANK_KIT_IDS);

    for (const [row, kit] of TANK_KIT_IDS.entries()) {
      expect(Object.keys(TANK_PART_SETS[kit].parts)).toEqual(TANK_PART_SLOTS);
      expect(TANK_PART_SLOTS.map((slot) =>
        TANK_PART_SETS[kit].parts[slot].source)).toEqual(
        TANK_PART_SLOTS.map((_, column) => ({
          x: column * 256,
          y: row * 128,
          width: 256,
          height: 128,
        })),
      );
    }
  });

  it('resolves every slot independently from a mixed player loadout', () => {
    const loadout: TankLoadout = {
      treads: 'jackal',
      hull: 'ranger',
      turret: 'foundry',
      barrel: 'jackal',
    };

    expect(TANK_PART_SLOTS.map((slot) =>
      tankPartDefinition(loadout, slot).source.y)).toEqual([
      384,
      128,
      0,
      384,
    ]);
    expect(tankPartDefinition(DEFAULT_TANK_LOADOUT, 'barrel')).toBe(
      DEFAULT_TANK_PART_SET.parts.barrel,
    );
  });

  it('anchors the visible barrel pivot and muzzle to shared engine geometry', () => {
    const tank = {
      x: 240,
      y: 410,
      angle: 42,
    } as TankState;
    const mount = tankBarrelMount(tank);
    const tip = barrelTip(tank, BARREL_LENGTH);

    expect(mount.pivot).toEqual({
      x: tank.x,
      y: tank.y - BARREL_PIVOT_HEIGHT,
    });
    expect(mount.muzzle).toEqual(tip);
    expect(Math.hypot(
      mount.muzzle.x - mount.pivot.x,
      mount.muzzle.y - mount.pivot.y,
    )).toBeCloseTo(BARREL_LENGTH, 8);

    const barrel = DEFAULT_TANK_PART_SET.parts.barrel;
    expect(barrel.pivotX).toBe(-barrel.offsetX);
    expect(barrel.muzzleX).toBe(BARREL_LENGTH - barrel.offsetX);
    expect(barrel.muzzleX - barrel.pivotX).toBe(BARREL_LENGTH);
    expect(barrel.height).toBeGreaterThanOrEqual(12);
  });
});

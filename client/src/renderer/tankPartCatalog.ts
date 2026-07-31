import {
  BARREL_LENGTH,
  BARREL_PIVOT_HEIGHT,
  barrelTip,
} from '@shared/engine/Tank';
import type { TankState } from '@shared/types/GameState';
import {
  TANK_KIT_IDS,
  TANK_PART_SLOTS,
  type TankKitId,
  type TankLoadout,
  type TankPartSlot,
} from '@shared/types/TankLoadout';

export { TANK_KIT_IDS, TANK_PART_SLOTS };
export type { TankKitId, TankPartSlot };

export const TANK_PART_ATLAS_ASSET = 'art/tank-parts.webp';
export const TANK_PART_ATLAS_WIDTH = 1024;
export const TANK_PART_ATLAS_HEIGHT = 512;
export const TANK_PART_CELL_WIDTH = 256;
export const TANK_PART_CELL_HEIGHT = 128;

export interface TankPartSource {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TankPartDefinition {
  readonly source: TankPartSource;
  /** Gameplay-scale destination box relative to the tank surface anchor. */
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;
  /** Barrel-only rendered-part-local logical coordinates; zero for static parts. */
  readonly pivotX: number;
  readonly muzzleX: number;
}

export interface TankPartSet {
  readonly id: TankKitId;
  readonly parts: Record<TankPartSlot, TankPartDefinition>;
}

const source = (column: number, row: number): TankPartSource => ({
  x: column * TANK_PART_CELL_WIDTH,
  y: row * TANK_PART_CELL_HEIGHT,
  width: TANK_PART_CELL_WIDTH,
  height: TANK_PART_CELL_HEIGHT,
});

/**
 * All four authored families share one gameplay footprint and mount contract.
 * Each row was composed as a complete tank before its exclusive slot partition.
 */
function partSet(id: TankKitId, row: number): TankPartSet {
  return {
    id,
    parts: {
    treads: {
      source: source(0, row),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    hull: {
      source: source(1, row),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    turret: {
      source: source(2, row),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    barrel: {
      source: source(3, row),
      offsetX: -7,
      offsetY: -7,
      width: 30,
      height: 14,
      pivotX: 7,
      muzzleX: 7 + BARREL_LENGTH,
    },
    },
  };
}

export const TANK_PART_SETS: Readonly<Record<TankKitId, TankPartSet>> = {
  foundry: partSet('foundry', 0),
  ranger: partSet('ranger', 1),
  bulwark: partSet('bulwark', 2),
  jackal: partSet('jackal', 3),
};

export const DEFAULT_TANK_PART_SET = TANK_PART_SETS.foundry;

/** Resolve one slot independently so mixed-kit loadouts remain data-driven. */
export function tankPartDefinition(
  loadout: Readonly<TankLoadout>,
  slot: TankPartSlot,
): TankPartDefinition {
  return TANK_PART_SETS[loadout[slot]].parts[slot];
}

export interface TankBarrelMount {
  readonly pivot: { readonly x: number; readonly y: number };
  readonly muzzle: { readonly x: number; readonly y: number };
  readonly radians: number;
}

/** Shared render mount derived entirely from the deterministic engine contract. */
export function tankBarrelMount(
  tank: Readonly<TankState>,
): TankBarrelMount {
  return {
    pivot: {
      x: tank.x,
      y: tank.y - BARREL_PIVOT_HEIGHT,
    },
    muzzle: barrelTip(tank as TankState, BARREL_LENGTH),
    radians: -tank.angle * Math.PI / 180,
  };
}

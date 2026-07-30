import {
  BARREL_LENGTH,
  BARREL_PIVOT_HEIGHT,
  barrelTip,
} from '@shared/engine/Tank';
import type { TankState } from '@shared/types/GameState';

export const TANK_PART_ATLAS_ASSET = 'art/tank-parts.webp';
export const TANK_PART_ATLAS_WIDTH = 1024;
export const TANK_PART_ATLAS_HEIGHT = 128;
export const TANK_PART_CELL_WIDTH = 256;
export const TANK_PART_CELL_HEIGHT = 128;

export const TANK_PART_SLOTS = [
  'treads',
  'hull',
  'turret',
  'barrel',
] as const;

export type TankPartSlot = (typeof TANK_PART_SLOTS)[number];

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
  readonly id: string;
  readonly parts: Record<TankPartSlot, TankPartDefinition>;
}

const source = (column: number): TankPartSource => ({
  x: column * TANK_PART_CELL_WIDTH,
  y: 0,
  width: TANK_PART_CELL_WIDTH,
  height: TANK_PART_CELL_HEIGHT,
});

/**
 * One coherent starter set. Slot-local layout data keeps the renderer generic:
 * future compatible sets can replace any definition without branching on style.
 */
export const DEFAULT_TANK_PART_SET: TankPartSet = {
  id: 'foundry',
  parts: {
    treads: {
      source: source(0),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    hull: {
      source: source(1),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    turret: {
      source: source(2),
      offsetX: -18,
      offsetY: -24,
      width: 36,
      height: 24,
      pivotX: 0,
      muzzleX: 0,
    },
    barrel: {
      source: source(3),
      offsetX: -7,
      offsetY: -7,
      width: 30,
      height: 14,
      pivotX: 7,
      muzzleX: 7 + BARREL_LENGTH,
    },
  },
};

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

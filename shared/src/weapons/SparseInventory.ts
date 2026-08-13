import type { AmmoEntry, TankState } from '../types/GameState.ts';
import type { WeaponId } from './WeaponRegistry.ts';

/**
 * Runtime-compatible sparse view over TankState.inventory. Legacy TankState still
 * declares the original exhaustive union during the staged migration, but plain
 * object storage already serializes arbitrary registered IDs safely.
 */
export type SparseWeaponInventory = Record<WeaponId, AmmoEntry | undefined>;

export function sparseInventory(tank: TankState): SparseWeaponInventory {
  return tank.inventory as unknown as SparseWeaponInventory;
}

export function readAmmo(tank: TankState, id: WeaponId): AmmoEntry {
  return sparseInventory(tank)[id] ?? { count: 0, unlimited: false };
}

export function ensureAmmo(tank: TankState, id: WeaponId): AmmoEntry {
  const inventory = sparseInventory(tank);
  const existing = inventory[id];
  if (existing) return existing;
  const created: AmmoEntry = { count: 0, unlimited: false };
  inventory[id] = created;
  return created;
}

export function grantAmmo(tank: TankState, id: WeaponId, count: number): AmmoEntry {
  const slot = ensureAmmo(tank, id);
  slot.count += Math.max(0, Math.floor(count));
  return slot;
}

export function setUnlimitedAmmo(tank: TankState, id: WeaponId, unlimited = true): AmmoEntry {
  const slot = ensureAmmo(tank, id);
  slot.unlimited = unlimited;
  return slot;
}

export function consumeAmmo(tank: TankState, id: WeaponId): boolean {
  const slot = sparseInventory(tank)[id];
  if (!slot) return false;
  if (slot.unlimited) return true;
  if (slot.count <= 0) return false;
  slot.count -= 1;
  return true;
}

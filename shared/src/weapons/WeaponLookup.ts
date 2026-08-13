import { weaponRegistry } from './registry.ts';
import type { RegisteredWeaponDefinition, WeaponId } from './WeaponRegistry.ts';

/** Runtime guard for untyped action/store/replay boundaries. */
export function isRegisteredWeaponId(value: unknown): value is WeaponId {
  return typeof value === 'string' && weaponRegistry.has(value);
}

/** Fail-closed lookup for untyped boundaries that require a registered definition. */
export function requireRegisteredWeapon(value: unknown): RegisteredWeaponDefinition {
  if (!isRegisteredWeaponId(value)) {
    throw new Error(`Unknown registered content id: ${String(value)}`);
  }
  return weaponRegistry.require(value);
}

/** Narrow an arbitrary registered id to an entry supported by the staged composed path. */
export function isComposedWeaponId(value: unknown): value is WeaponId {
  return isRegisteredWeaponId(value) && weaponRegistry.require(value).execution.kind === 'composed';
}

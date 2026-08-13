import { WeaponRegistry } from './WeaponRegistry.ts';
import { LEGACY_CORE_PACK } from './packs/legacy-core.ts';

/**
 * Process-wide immutable-content registry.
 *
 * Add future packs here (or through a generated pack index once the catalog is
 * large). Nothing in the engine/store should need a new switch simply because a
 * pack contains ten more definitions.
 */
export const weaponRegistry = new WeaponRegistry()
  .registerPack(LEGACY_CORE_PACK);

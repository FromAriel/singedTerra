import { DIRECT_001_PACK } from '../content/packs/direct-001.ts';
import { WeaponRegistry } from './WeaponRegistry.ts';
import { LEGACY_CORE_PACK } from './packs/legacy-core.ts';

/**
 * Process-wide immutable-content registry. New packs register here; engine/store
 * consumers discover them without growing a hand-maintained central item union.
 */
export const weaponRegistry = new WeaponRegistry()
  .registerPack(LEGACY_CORE_PACK)
  .registerPack(DIRECT_001_PACK);

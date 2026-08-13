import { getComposableContent } from './ComposableCatalog.ts';
import { weaponRegistry } from '../weapons/registry.ts';
import {
  WEAPONS,
  type WeaponDefinition,
  type WeaponType,
} from '../engine/WeaponSystem.ts';

/**
 * Compatibility bridge for Slice 3.
 *
 * The authoritative GameEngine still asks WeaponSystem.getWeapon() for impact
 * semantics. Until the core dispatcher itself speaks WeaponRegistry natively,
 * install a deterministic WeaponDefinition adapter for every composed direct-fire
 * entry. The adapter owns only generic contact metadata; emission timing and
 * presentation are handled by the composed runtime.
 */
export function installPlayableDirectBridge(): readonly string[] {
  const table = WEAPONS as unknown as Record<string, WeaponDefinition>;
  const installed: string[] = [];

  for (const registered of weaponRegistry.all()) {
    if (registered.execution.kind !== 'composed') continue;
    if (registered.execution.delivery !== 'direct_fire') continue;
    if (registered.execution.payload !== 'kinetic') continue;

    const profileId = registered.execution.modifiers?.[0];
    if (!profileId) continue;
    const profile = getComposableContent(profileId);
    if (!profile) continue;

    if (!table[registered.id]) {
      table[registered.id] = Object.freeze({
        type: registered.id as WeaponType,
        name: registered.name,
        implemented: true,
        price: registered.store.price,
        bundleSize: registered.store.bundleSize,
        armsLevel: registered.store.armsLevel,
        detonation: Object.freeze({
          // Collision is against a 20x12 tank box whose center is at the body's
          // midpoint. A 13px envelope covers every possible box-entry point while
          // a steep falloff keeps the result contact-like rather than area-like.
          radius: 13,
          maxDamage: profile.impactScore,
          falloffExponent: 32,
          preservesTerrain: true,
          style: 'blast',
          color: profile.color,
          durationFrames: 1,
        }),
      });
    }
    installed.push(registered.id);
  }

  return Object.freeze(installed.sort());
}

export const PLAYABLE_DIRECT_IDS = installPlayableDirectBridge();

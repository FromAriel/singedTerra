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
 * entry. The adapter owns only generic impact metadata; emission shape is handled
 * by the composed runtime before the first engine tick. After that, the production
 * GameEngine owns collision, damage, shields, scoring, walls, and turn resolution
 * exactly like the legacy arsenal.
 *
 * This is intentionally data-driven: adding another direct-fire definition that
 * references a valid composition profile requires no new engine branch.
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
          // Game-space contact envelope. The engine's damage primitive measures
          // from impact to tank center; a direct AABB hit therefore needs a small
          // contact radius rather than a 1px point. Preserve terrain so this reads
          // as direct kinetic contact, not as a chain of miniature craters.
          radius: 18 + Math.max(0, profile.terrainPixels - 1) * 2,
          maxDamage: profile.impactScore,
          preservesTerrain: true,
          style: profile.style === 'fan' || profile.style === 'wall' ? 'cluster' : 'blast',
          color: profile.color,
          durationFrames: profile.style === 'tap' ? 20 : 28,
        }),
      });
    }
    installed.push(registered.id);
  }

  return Object.freeze(installed.sort());
}

export const PLAYABLE_DIRECT_IDS = installPlayableDirectBridge();

import { WEAPONS, type WeaponType } from '../../engine/WeaponSystem.ts';
import {
  defineWeapon,
  defineWeaponPack,
  type WeaponDanger,
  type WeaponFamily,
  type WeaponRarity,
} from '../WeaponRegistry.ts';

function familyFor(type: WeaponType): WeaponFamily {
  switch (type) {
    case 'baby_missile':
    case 'missile':
    case 'heavy_missile':
      return 'missile';
    case 'baby_nuke':
    case 'nuke':
      return 'nuclear';
    case 'cluster_bomb':
    case 'mirv':
    case 'deaths_head':
    case 'funky_bomb':
      return 'cluster';
    case 'napalm':
    case 'hot_napalm':
      return 'incendiary';
    case 'dirt_bomb':
    case 'riot_bomb':
    case 'sandhog':
      return 'terrain';
    case 'shield':
    case 'heavy_shield':
      return 'defense';
    case 'bouncing_betty':
      return 'kinetic';
    case 'tracer':
      return 'ballistic';
  }
}

function rarityFor(armsLevel: number, price: number): WeaponRarity {
  if (armsLevel >= 4 || price >= 20_000) return 'legendary';
  if (armsLevel >= 3 || price >= 14_000) return 'exotic';
  if (armsLevel >= 2 || price >= 9_000) return 'rare';
  if (armsLevel >= 1 || price >= 4_000) return 'uncommon';
  return 'common';
}

function dangerFor(type: WeaponType): WeaponDanger {
  if (type === 'nuke' || type === 'deaths_head') return 'strategic';
  if (type === 'baby_nuke' || type === 'mirv' || type === 'hot_napalm') return 'heavy';
  return 'conventional';
}

function tagsFor(type: WeaponType): readonly string[] {
  const def = WEAPONS[type];
  const tags = new Set<string>(['legacy-core', familyFor(type)]);
  if (def.behavior?.airburst) tags.add('multi-payload');
  if (def.behavior?.bounce) tags.add('bounce');
  if (def.behavior?.napalm) tags.add('persistent-field');
  if (def.behavior?.sandhog) tags.add('burrowing');
  if (def.behavior?.shield) tags.add('defensive');
  if (def.detonation.raisesTerrain) tags.add('terrain-builder');
  if (def.detonation.preservesTerrain) tags.add('terrain-preserving');
  if (def.detonation.maxDamage === 0) tags.add('utility');
  return [...tags];
}

/**
 * Compatibility pack for the entire pre-registry arsenal.
 *
 * This is intentionally generated from WEAPONS rather than copying tuning. The
 * old engine definition remains the single source of truth for execution during
 * Slice 1 while the scalable content layer becomes the source of discovery and
 * store metadata. Later slices can migrate entries to composed/custom execution
 * one family at a time without changing their stable IDs.
 */
export const LEGACY_CORE_PACK = defineWeaponPack({
  id: 'legacy-core',
  version: 1,
  name: 'singedTerra Legacy Core Arsenal',
  weapons: (Object.keys(WEAPONS) as WeaponType[]).map((type) => {
    const def = WEAPONS[type];
    return defineWeapon({
      id: type,
      schemaVersion: 1,
      name: def.name,
      description: `Canonical singedTerra ${def.name} implementation.`,
      family: familyFor(type),
      tags: tagsFor(type),
      rarity: rarityFor(def.armsLevel, def.price),
      danger: dangerFor(type),
      store: {
        price: def.price,
        bundleSize: def.bundleSize,
        armsLevel: def.armsLevel,
        weight: type === 'baby_missile' ? 0 : Math.max(1, 100 - def.armsLevel * 18),
        hidden: type === 'baby_missile',
      },
      execution: {
        kind: 'legacy-core',
        weaponType: type,
        definition: def,
      },
    });
  }),
});

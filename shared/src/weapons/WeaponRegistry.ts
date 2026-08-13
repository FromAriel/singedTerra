import type { WeaponDefinition, WeaponType } from '../engine/WeaponSystem.ts';

/**
 * Stable content identifier used by the scalable arsenal layer.
 *
 * Slice 1 deliberately keeps the legacy engine's WeaponType union as an execution
 * adapter while content discovery moves to string IDs. Future packs can therefore
 * be registered without growing a central TypeScript union; engine migration can
 * happen independently behind the registry boundary.
 */
export type WeaponId = string;

export type WeaponFamily =
  | 'ballistic'
  | 'firearm'
  | 'rocket'
  | 'missile'
  | 'cluster'
  | 'mine'
  | 'bomb'
  | 'nuclear'
  | 'incendiary'
  | 'cryo'
  | 'electrical'
  | 'emp'
  | 'laser'
  | 'plasma'
  | 'particle'
  | 'chemical'
  | 'gas'
  | 'liquid'
  | 'geological'
  | 'terrain'
  | 'weather'
  | 'gravity'
  | 'magnetic'
  | 'sonic'
  | 'kinetic'
  | 'beam'
  | 'biological'
  | 'nanotech'
  | 'drone'
  | 'deployable'
  | 'orbital'
  | 'portal'
  | 'time'
  | 'quantum'
  | 'dimensional'
  | 'matter'
  | 'defense'
  | 'mobility'
  | 'economic'
  | 'support'
  | 'comedy'
  | 'cursed'
  | 'meta'
  | 'apocalypse'
  | 'other';

export type WeaponRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'exotic'
  | 'legendary'
  | 'forbidden';

export type WeaponDanger =
  | 'conventional'
  | 'heavy'
  | 'strategic'
  | 'catastrophic'
  | 'extinction';

export interface WeaponStoreMetadata {
  /** Base purchase price in normal economy mode. */
  readonly price: number;
  /** Ammo/charges granted by one purchase. */
  readonly bundleSize: number;
  /** Store arms-level gate. */
  readonly armsLevel: number;
  /** Relative chance of selection into a seeded run catalog. 0 = never randomly selected. */
  readonly weight: number;
  /** Hide from normal seeded stores. Full-catalog developer tools may still expose it. */
  readonly hidden?: boolean;
  /** Earliest round in which this item may rotate onto a shelf. */
  readonly minRound?: number;
  /** Maximum copies of this definition allowed in one generated run catalog. */
  readonly maxPerRun?: number;
  /** At most one member of a named exclusive group is selected into a run catalog. */
  readonly exclusiveGroup?: string;
}

/**
 * Execution boundary for arsenal content.
 *
 * - legacy-core: today's WeaponSystem/GameEngine implementation, behavior unchanged.
 * - composed: future data-driven delivery/payload/modifier executor.
 * - custom: future bespoke deterministic handler for singularities, portals, etc.
 */
export type WeaponExecution =
  | {
      readonly kind: 'legacy-core';
      readonly weaponType: WeaponType;
      readonly definition: WeaponDefinition;
    }
  | {
      readonly kind: 'composed';
      readonly delivery: string;
      readonly payload: string;
      readonly modifiers?: readonly string[];
    }
  | {
      readonly kind: 'custom';
      readonly handler: string;
    };

export interface RegisteredWeaponDefinition {
  readonly id: WeaponId;
  readonly schemaVersion: 1;
  readonly name: string;
  readonly description: string;
  readonly family: WeaponFamily;
  readonly subfamily?: string;
  readonly tags: readonly string[];
  readonly rarity: WeaponRarity;
  readonly danger: WeaponDanger;
  readonly store: WeaponStoreMetadata;
  readonly execution: WeaponExecution;
}

export interface WeaponPack {
  readonly id: string;
  readonly version: 1;
  readonly name: string;
  readonly weapons: readonly RegisteredWeaponDefinition[];
}

const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function validateWeaponDefinition(def: RegisteredWeaponDefinition): void {
  if (!ID_PATTERN.test(def.id)) throw new Error(`WeaponRegistry: invalid weapon id "${def.id}"`);
  if (!def.name.trim()) throw new Error(`WeaponRegistry: ${def.id} has an empty name`);
  if (!def.description.trim()) throw new Error(`WeaponRegistry: ${def.id} has an empty description`);
  if (def.schemaVersion !== 1) throw new Error(`WeaponRegistry: ${def.id} has unsupported schemaVersion`);
  if (!finiteNonNegative(def.store.price)) throw new Error(`WeaponRegistry: ${def.id} has invalid price`);
  if (!Number.isInteger(def.store.bundleSize) || def.store.bundleSize <= 0) {
    throw new Error(`WeaponRegistry: ${def.id} has invalid bundleSize`);
  }
  if (!Number.isInteger(def.store.armsLevel) || def.store.armsLevel < 0 || def.store.armsLevel > 4) {
    throw new Error(`WeaponRegistry: ${def.id} has invalid armsLevel`);
  }
  if (!finiteNonNegative(def.store.weight)) throw new Error(`WeaponRegistry: ${def.id} has invalid store weight`);
  if (def.store.minRound !== undefined && (!Number.isInteger(def.store.minRound) || def.store.minRound < 1)) {
    throw new Error(`WeaponRegistry: ${def.id} has invalid minRound`);
  }
  if (def.store.maxPerRun !== undefined && (!Number.isInteger(def.store.maxPerRun) || def.store.maxPerRun < 1)) {
    throw new Error(`WeaponRegistry: ${def.id} has invalid maxPerRun`);
  }

  const normalizedTags = def.tags.map((tag) => tag.trim()).filter(Boolean);
  if (normalizedTags.length !== def.tags.length) {
    throw new Error(`WeaponRegistry: ${def.id} contains an empty tag`);
  }
  if (new Set(normalizedTags).size !== normalizedTags.length) {
    throw new Error(`WeaponRegistry: ${def.id} contains duplicate tags`);
  }

  if (def.execution.kind === 'legacy-core') {
    if (def.execution.weaponType !== def.execution.definition.type) {
      throw new Error(`WeaponRegistry: ${def.id} legacy adapter does not match WeaponDefinition.type`);
    }
  } else if (def.execution.kind === 'composed') {
    if (!def.execution.delivery.trim() || !def.execution.payload.trim()) {
      throw new Error(`WeaponRegistry: ${def.id} composed execution requires delivery + payload`);
    }
  } else if (!def.execution.handler.trim()) {
    throw new Error(`WeaponRegistry: ${def.id} custom execution requires a handler id`);
  }
}

export function defineWeapon(def: RegisteredWeaponDefinition): RegisteredWeaponDefinition {
  validateWeaponDefinition(def);
  return Object.freeze({
    ...def,
    tags: Object.freeze([...def.tags]),
    store: Object.freeze({ ...def.store }),
    execution: Object.freeze({ ...def.execution }),
  });
}

export function defineWeaponPack(pack: WeaponPack): WeaponPack {
  if (!ID_PATTERN.test(pack.id)) throw new Error(`WeaponRegistry: invalid pack id "${pack.id}"`);
  if (!pack.name.trim()) throw new Error(`WeaponRegistry: ${pack.id} has an empty pack name`);
  if (pack.version !== 1) throw new Error(`WeaponRegistry: ${pack.id} has unsupported pack version`);
  if (pack.weapons.length === 0) throw new Error(`WeaponRegistry: ${pack.id} contains no weapons`);

  const ids = new Set<string>();
  for (const weapon of pack.weapons) {
    validateWeaponDefinition(weapon);
    if (ids.has(weapon.id)) throw new Error(`WeaponRegistry: duplicate weapon id "${weapon.id}" inside ${pack.id}`);
    ids.add(weapon.id);
  }

  return Object.freeze({ ...pack, weapons: Object.freeze([...pack.weapons]) });
}

/**
 * Read-only registry assembled from one or more independently-authored weapon packs.
 * Duplicate IDs fail immediately so adding content can never silently replace an
 * existing weapon. Registration order is retained for stable tooling/codex output;
 * seeded store selection sorts its own candidates before random sampling.
 */
export class WeaponRegistry {
  private readonly byId = new Map<WeaponId, RegisteredWeaponDefinition>();
  private readonly packList: WeaponPack[] = [];

  registerPack(pack: WeaponPack): this {
    const validated = defineWeaponPack(pack);
    for (const weapon of validated.weapons) {
      if (this.byId.has(weapon.id)) {
        throw new Error(`WeaponRegistry: duplicate weapon id "${weapon.id}" across packs`);
      }
    }
    for (const weapon of validated.weapons) this.byId.set(weapon.id, weapon);
    this.packList.push(validated);
    return this;
  }

  has(id: WeaponId): boolean {
    return this.byId.has(id);
  }

  get(id: WeaponId): RegisteredWeaponDefinition | undefined {
    return this.byId.get(id);
  }

  require(id: WeaponId): RegisteredWeaponDefinition {
    const weapon = this.byId.get(id);
    if (!weapon) throw new Error(`WeaponRegistry: unknown weapon id "${id}"`);
    return weapon;
  }

  all(): readonly RegisteredWeaponDefinition[] {
    return [...this.byId.values()];
  }

  ids(): readonly WeaponId[] {
    return [...this.byId.keys()];
  }

  packs(): readonly WeaponPack[] {
    return [...this.packList];
  }

  get size(): number {
    return this.byId.size;
  }
}

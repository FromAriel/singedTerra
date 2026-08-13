import type { RegisteredWeaponDefinition, WeaponId, WeaponRegistry } from './WeaponRegistry.ts';

export type StoreMode = 'seeded' | 'full_catalog';

export interface RunCatalogOptions {
  readonly seed: number;
  readonly catalogSize?: number;
  readonly armsLevel?: number;
  readonly round?: number;
  readonly includeHidden?: boolean;
}

export interface ShelfOptions {
  readonly seed: number;
  readonly epoch: number;
  readonly shelfSize?: number;
}

const DEFAULT_CATALOG_SIZE = 36;
const DEFAULT_SHELF_SIZE = 9;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function stringHash(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mix32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function deterministicUnit(seed: number, salt: number, id: string): number {
  const mixed = mix32((seed >>> 0) ^ Math.imul(salt + 1, 0x9e3779b1) ^ stringHash(id));
  return (mixed + 1) / 0x1_0000_0001;
}

function eligible(
  weapon: RegisteredWeaponDefinition,
  armsLevel: number,
  round: number,
  includeHidden: boolean,
): boolean {
  if (!includeHidden && weapon.store.hidden) return false;
  if (weapon.store.armsLevel > armsLevel) return false;
  if ((weapon.store.minRound ?? 1) > round) return false;
  return weapon.store.weight > 0 || includeHidden;
}

/**
 * Deterministically selects a small, run-specific subset from an arbitrarily
 * large registry. Weighted random selection is WITHOUT replacement. Exclusive
 * groups are enforced as soon as one member is selected, giving a run a stronger
 * identity than independent coin flips would.
 *
 * The score uses -ln(U)/weight (Efraimidis-Spirakis weighted sampling). Lower is
 * better. U is a pure hash of (seed, stable candidate id), so catalog generation
 * consumes no global RNG state and returns the same result on every client.
 */
export function generateRunCatalog(
  registry: WeaponRegistry,
  options: RunCatalogOptions,
): readonly WeaponId[] {
  const armsLevel = clampInt(options.armsLevel ?? 4, 0, 4);
  const round = Math.max(1, clampInt(options.round ?? 1, 1, Number.MAX_SAFE_INTEGER));
  const includeHidden = options.includeHidden === true;
  const candidates = registry.all()
    .filter((weapon) => eligible(weapon, armsLevel, round, includeHidden))
    .sort((a, b) => a.id.localeCompare(b.id));

  const target = clampInt(options.catalogSize ?? DEFAULT_CATALOG_SIZE, 0, candidates.length);
  const ranked = candidates.map((weapon, index) => {
    const weight = Math.max(weapon.store.weight, includeHidden ? 0.0001 : 0);
    const u = deterministicUnit(options.seed, index, weapon.id);
    const score = -Math.log(u) / weight;
    return { weapon, score };
  }).sort((a, b) => a.score - b.score || a.weapon.id.localeCompare(b.weapon.id));

  const selected: WeaponId[] = [];
  const exclusiveGroups = new Set<string>();
  for (const { weapon } of ranked) {
    if (selected.length >= target) break;
    const group = weapon.store.exclusiveGroup;
    if (group && exclusiveGroups.has(group)) continue;
    selected.push(weapon.id);
    if (group) exclusiveGroups.add(group);
  }

  return selected;
}

/** Return every eligible registry item in stable ID order for developer tooling. */
export function generateFullCatalog(
  registry: WeaponRegistry,
  options: Omit<RunCatalogOptions, 'catalogSize'>,
): readonly WeaponId[] {
  const armsLevel = clampInt(options.armsLevel ?? 4, 0, 4);
  const round = Math.max(1, clampInt(options.round ?? 1, 1, Number.MAX_SAFE_INTEGER));
  const includeHidden = options.includeHidden === true;
  return registry.all()
    .filter((weapon) => eligible(weapon, armsLevel, round, includeHidden))
    .map((weapon) => weapon.id)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Rotate a small shelf from the already-selected run catalog. The run catalog is
 * stable for the match; epoch (normally round/shop refresh) changes only the shelf.
 */
export function generateShelf(
  runCatalog: readonly WeaponId[],
  options: ShelfOptions,
): readonly WeaponId[] {
  const size = clampInt(options.shelfSize ?? DEFAULT_SHELF_SIZE, 0, runCatalog.length);
  return [...runCatalog]
    .map((id, index) => ({
      id,
      score: deterministicUnit(options.seed ^ Math.imul(options.epoch + 1, 0x85ebca6b), index, id),
    }))
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .slice(0, size)
    .map(({ id }) => id);
}

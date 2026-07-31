/** Authored visual families available to every player for free. */
export const TANK_KIT_IDS = [
  'foundry',
  'ranger',
  'bulwark',
  'jackal',
] as const;
export type TankKitId = (typeof TANK_KIT_IDS)[number];

/** Independently selectable visual slots; order is stable for UI and atlases. */
export const TANK_PART_SLOTS = [
  'treads',
  'hull',
  'turret',
  'barrel',
] as const;
export type TankPartSlot = (typeof TANK_PART_SLOTS)[number];

/** Presentation-only tank composition. Never consumed by simulation logic. */
export type TankLoadout = Record<TankPartSlot, TankKitId>;

export const DEFAULT_TANK_LOADOUT: Readonly<TankLoadout> = Object.freeze({
  treads: 'foundry',
  hull: 'foundry',
  turret: 'foundry',
  barrel: 'foundry',
});

const KIT_IDS = new Set<string>(TANK_KIT_IDS);

function defaultLoadout(): TankLoadout {
  return { ...DEFAULT_TANK_LOADOUT };
}

/**
 * Normalize untrusted/legacy roster data. Only an exact four-field allowlisted
 * object survives; everything else fails closed to a fresh Foundry preset.
 */
export function normalizeTankLoadout(value: unknown): TankLoadout {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return defaultLoadout();
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== TANK_PART_SLOTS.length
    || !TANK_PART_SLOTS.every((slot) =>
      Object.hasOwn(record, slot)
      && typeof record[slot] === 'string'
      && KIT_IDS.has(record[slot]))
  ) {
    return defaultLoadout();
  }
  return {
    treads: record.treads as TankKitId,
    hull: record.hull as TankKitId,
    turret: record.turret as TankKitId,
    barrel: record.barrel as TankKitId,
  };
}

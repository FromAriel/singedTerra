export const TANK_KIT_IDS = [
  'foundry',
  'ranger',
  'bulwark',
  'jackal',
] as const
export type TankKitId = (typeof TANK_KIT_IDS)[number]

export const TANK_PART_SLOTS = ['treads', 'hull', 'turret', 'barrel'] as const
export type TankPartSlot = (typeof TANK_PART_SLOTS)[number]
export type TankLoadout = Record<TankPartSlot, TankKitId>

export const DEFAULT_TANK_LOADOUT: Readonly<TankLoadout> = Object.freeze({
  treads: 'foundry',
  hull: 'foundry',
  turret: 'foundry',
  barrel: 'foundry',
})

const KIT_IDS = new Set<string>(TANK_KIT_IDS)

/** Strict request-boundary parser: invalid, partial, or over-posted data fails. */
export function parseTankLoadout(value: unknown): TankLoadout | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (
    keys.length !== TANK_PART_SLOTS.length
    || !TANK_PART_SLOTS.every((slot) =>
      Object.hasOwn(record, slot)
      && typeof record[slot] === 'string'
      && KIT_IDS.has(record[slot]))
  ) {
    return null
  }
  return {
    treads: record.treads as TankKitId,
    hull: record.hull as TankKitId,
    turret: record.turret as TankKitId,
    barrel: record.barrel as TankKitId,
  }
}

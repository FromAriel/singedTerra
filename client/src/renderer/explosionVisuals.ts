import { blastReachRadius } from '@shared/engine/BlastGeometry';
import type { WeaponType } from '@shared/engine/WeaponSystem';
import { getComposableContent, type ComposableContentProfile } from '@shared/content/ComposableCatalog';
import { weaponRegistry } from '@shared/weapons/registry';
import type { ExplosionEvent } from '@shared/types/GameState';

export type ExplosionVisualFamily =
  | 'conventional'
  | 'nuclear'
  | 'earth'
  | 'incendiary'
  | 'scatter'
  | 'funky'
  | 'mine';

export interface ExplosionVisualProfile {
  family: ExplosionVisualFamily;
  accent: string;
  /** Exact shared style-aware outer visual/damage boundary. */
  reachRadius: number;
  /** White-hot or dense center, always contained by reachRadius. */
  coreRadius: number;
  /** Furthest family-detail center/vertex, always contained by reachRadius. */
  detailRadius: number;
  /** Vertical shaping for low incendiary/earth effects. */
  verticalScale: number;
  /** Bounded family detail count used by the Canvas pass. */
  detailCount: number;
}

interface BaseProfile {
  family: ExplosionVisualFamily;
  coreScale: number;
  detailScale: number;
  verticalScale: number;
  detailCount: number;
}

const BASE_PROFILES = {
  baby_missile: {
    family: 'conventional', coreScale: 0.28, detailScale: 0.78, verticalScale: 1, detailCount: 9,
  },
  missile: {
    family: 'conventional', coreScale: 0.3, detailScale: 0.8, verticalScale: 1, detailCount: 9,
  },
  heavy_missile: {
    family: 'conventional', coreScale: 0.34, detailScale: 0.82, verticalScale: 1, detailCount: 10,
  },
  baby_nuke: {
    family: 'nuclear', coreScale: 0.38, detailScale: 0.82, verticalScale: 1, detailCount: 2,
  },
  nuke: {
    family: 'nuclear', coreScale: 0.42, detailScale: 0.86, verticalScale: 1, detailCount: 3,
  },
  dirt_bomb: {
    family: 'earth', coreScale: 0.24, detailScale: 0.68, verticalScale: 0.76, detailCount: 7,
  },
  bouncing_betty: {
    family: 'mine', coreScale: 0.3, detailScale: 0.72, verticalScale: 1, detailCount: 8,
  },
  funky_bomb: {
    family: 'funky', coreScale: 0.22, detailScale: 1, verticalScale: 1, detailCount: 10,
  },
  napalm: {
    family: 'incendiary', coreScale: 0.3, detailScale: 0.8, verticalScale: 0.58, detailCount: 5,
  },
  cluster_bomb: {
    family: 'scatter', coreScale: 0.32, detailScale: 0.74, verticalScale: 1, detailCount: 6,
  },
  mirv: {
    family: 'scatter', coreScale: 0.34, detailScale: 0.78, verticalScale: 1, detailCount: 7,
  },
  deaths_head: {
    family: 'scatter', coreScale: 0.36, detailScale: 0.82, verticalScale: 1, detailCount: 9,
  },
  riot_bomb: {
    family: 'earth', coreScale: 0.2, detailScale: 0.72, verticalScale: 0.68, detailCount: 8,
  },
  hot_napalm: {
    family: 'incendiary', coreScale: 0.34, detailScale: 0.84, verticalScale: 0.64, detailCount: 6,
  },
  sandhog: {
    family: 'earth', coreScale: 0.3, detailScale: 0.76, verticalScale: 0.72, detailCount: 9,
  },
  tracer: {
    family: 'conventional', coreScale: 0.5, detailScale: 0.9, verticalScale: 1, detailCount: 4,
  },
  shield: {
    // Defensive use never creates an event, but keep the total mapping safe.
    family: 'conventional', coreScale: 0.28, detailScale: 0.78, verticalScale: 1, detailCount: 9,
  },
  heavy_shield: {
    family: 'conventional', coreScale: 0.34, detailScale: 0.9, verticalScale: 1, detailCount: 12,
  },
} satisfies Record<WeaponType, BaseProfile>;

const FALLBACK_PROFILE: BaseProfile = Object.freeze({
  family: 'conventional',
  coreScale: 0.24,
  detailScale: 0.68,
  verticalScale: 1,
  detailCount: 4,
});

function composedProfileFor(weaponId: string): ComposableContentProfile | undefined {
  const registered = weaponRegistry.get(weaponId);
  if (registered?.execution.kind !== 'composed') return undefined;
  const profileId = registered.execution.modifiers?.[0];
  return profileId ? getComposableContent(profileId) : undefined;
}

function composedImpactBase(profile: ComposableContentProfile | undefined): BaseProfile | undefined {
  if (!profile) return undefined;
  const fanLike = profile.style === 'fan' || profile.style === 'wall';
  // Kinetic direct-fire impacts are contact sparks, not artillery fireballs.
  // The authoritative event radius still bounds damage/contact; these scales
  // deliberately keep the visual response compact inside that envelope.
  return {
    family: 'conventional',
    coreScale: fanLike ? 0.08 : 0.12,
    detailScale: fanLike ? 0.26 : 0.34,
    verticalScale: 1,
    detailCount: fanLike ? 2 : 3,
  };
}

export function getExplosionVisualProfile(
  event: Readonly<ExplosionEvent>,
): ExplosionVisualProfile {
  const weaponId = event.weaponType as unknown as string;
  const legacyBase = (BASE_PROFILES as unknown as Readonly<Record<string, BaseProfile | undefined>>)[weaponId];
  const base = legacyBase ?? composedImpactBase(composedProfileFor(weaponId)) ?? FALLBACK_PROFILE;
  const rawReach = blastReachRadius(event.radius, event.style);
  const reachRadius = Number.isFinite(rawReach) && rawReach > 0 ? rawReach : 0;

  return {
    family: base.family,
    accent: event.color,
    reachRadius,
    coreRadius: reachRadius * base.coreScale,
    detailRadius: reachRadius * base.detailScale,
    verticalScale: base.verticalScale,
    detailCount: base.detailCount,
  };
}

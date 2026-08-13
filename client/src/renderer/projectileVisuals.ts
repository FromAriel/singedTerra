import {
  WEAPONS,
  type WeaponDefinition,
  type WeaponType,
} from '@shared/engine/WeaponSystem';
import { getComposableContent, type ComposableContentProfile } from '@shared/content/ComposableCatalog';
import { weaponRegistry } from '@shared/weapons/registry';
import type { ProjectileState } from '@shared/types/GameState';

export type ProjectileSilhouette =
  | 'shell'
  | 'heavy'
  | 'nuclear'
  | 'earth'
  | 'mine'
  | 'napalm'
  | 'airburst'
  | 'drill'
  | 'submunition'
  | 'kinetic';

export interface ProjectileVisualProfile {
  silhouette: ProjectileSilhouette;
  accent: string;
  coreRadius: number;
  glowRadius: number;
  trailRadiusMin: number;
  trailRadiusMax: number;
  trailAlphaOld: number;
  trailAlphaNew: number;
  rotation: number;
}

type BaseProfile = Omit<ProjectileVisualProfile, 'accent' | 'rotation'>;

const BASE_PROFILES: Record<WeaponType, BaseProfile> = {
  baby_missile: {
    silhouette: 'shell',
    coreRadius: 3,
    glowRadius: 9,
    trailRadiusMin: 1.5,
    trailRadiusMax: 5,
    trailAlphaOld: 0.06,
    trailAlphaNew: 0.34,
  },
  missile: {
    silhouette: 'shell',
    coreRadius: 3.4,
    glowRadius: 10,
    trailRadiusMin: 1.7,
    trailRadiusMax: 5.2,
    trailAlphaOld: 0.07,
    trailAlphaNew: 0.36,
  },
  heavy_missile: {
    silhouette: 'heavy',
    coreRadius: 4.2,
    glowRadius: 12,
    trailRadiusMin: 2,
    trailRadiusMax: 6,
    trailAlphaOld: 0.08,
    trailAlphaNew: 0.4,
  },
  baby_nuke: {
    silhouette: 'nuclear',
    coreRadius: 4.8,
    glowRadius: 14,
    trailRadiusMin: 2.2,
    trailRadiusMax: 6.5,
    trailAlphaOld: 0.08,
    trailAlphaNew: 0.42,
  },
  nuke: {
    silhouette: 'nuclear',
    coreRadius: 6,
    glowRadius: 18,
    trailRadiusMin: 2.5,
    trailRadiusMax: 7.5,
    trailAlphaOld: 0.09,
    trailAlphaNew: 0.48,
  },
  dirt_bomb: {
    silhouette: 'earth',
    coreRadius: 4.5,
    glowRadius: 8,
    trailRadiusMin: 2.1,
    trailRadiusMax: 6.5,
    trailAlphaOld: 0.1,
    trailAlphaNew: 0.42,
  },
  bouncing_betty: {
    silhouette: 'mine',
    coreRadius: 4.3,
    glowRadius: 10,
    trailRadiusMin: 1.8,
    trailRadiusMax: 5.5,
    trailAlphaOld: 0.08,
    trailAlphaNew: 0.4,
  },
  funky_bomb: {
    silhouette: 'airburst',
    coreRadius: 4.3,
    glowRadius: 12,
    trailRadiusMin: 1.8,
    trailRadiusMax: 5.8,
    trailAlphaOld: 0.07,
    trailAlphaNew: 0.42,
  },
  napalm: {
    silhouette: 'napalm',
    coreRadius: 4.2,
    glowRadius: 14,
    trailRadiusMin: 2,
    trailRadiusMax: 6.2,
    trailAlphaOld: 0.09,
    trailAlphaNew: 0.46,
  },
  cluster_bomb: {
    silhouette: 'airburst',
    coreRadius: 4,
    glowRadius: 11,
    trailRadiusMin: 1.7,
    trailRadiusMax: 5.5,
    trailAlphaOld: 0.07,
    trailAlphaNew: 0.4,
  },
  mirv: {
    silhouette: 'airburst',
    coreRadius: 4.8,
    glowRadius: 13,
    trailRadiusMin: 2,
    trailRadiusMax: 6.2,
    trailAlphaOld: 0.08,
    trailAlphaNew: 0.44,
  },
  deaths_head: {
    silhouette: 'airburst',
    coreRadius: 5.2,
    glowRadius: 15,
    trailRadiusMin: 2.2,
    trailRadiusMax: 6.8,
    trailAlphaOld: 0.09,
    trailAlphaNew: 0.48,
  },
  riot_bomb: {
    silhouette: 'earth',
    coreRadius: 4,
    glowRadius: 7,
    trailRadiusMin: 2,
    trailRadiusMax: 6,
    trailAlphaOld: 0.09,
    trailAlphaNew: 0.38,
  },
  hot_napalm: {
    silhouette: 'napalm',
    coreRadius: 5,
    glowRadius: 16,
    trailRadiusMin: 2.3,
    trailRadiusMax: 7,
    trailAlphaOld: 0.1,
    trailAlphaNew: 0.52,
  },
  sandhog: {
    silhouette: 'drill',
    coreRadius: 5,
    glowRadius: 13,
    trailRadiusMin: 1.8,
    trailRadiusMax: 5.8,
    trailAlphaOld: 0.08,
    trailAlphaNew: 0.46,
  },
  tracer: {
    silhouette: 'shell',
    coreRadius: 2.2,
    glowRadius: 7,
    trailRadiusMin: 1,
    trailRadiusMax: 3.2,
    trailAlphaOld: 0.1,
    trailAlphaNew: 0.52,
  },
  shield: {
    // Defensive use never creates a projectile, but keep the total mapping safe
    // for malformed or future replay data.
    silhouette: 'shell',
    coreRadius: 3,
    glowRadius: 9,
    trailRadiusMin: 1.5,
    trailRadiusMax: 5,
    trailAlphaOld: 0.06,
    trailAlphaNew: 0.34,
  },
  heavy_shield: {
    silhouette: 'shell',
    coreRadius: 3.8,
    glowRadius: 11,
    trailRadiusMin: 1.8,
    trailRadiusMax: 5.8,
    trailAlphaOld: 0.05,
    trailAlphaNew: 0.3,
  },
};

const FALLBACK_PROFILE: BaseProfile = Object.freeze({
  silhouette: 'kinetic',
  coreRadius: 1.55,
  glowRadius: 6,
  trailRadiusMin: 0.65,
  trailRadiusMax: 2.4,
  trailAlphaOld: 0.06,
  trailAlphaNew: 0.46,
});

const SUBMUNITION_SCALE = 0.68;

function finiteRotation(vx: number, vy: number): number {
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || (vx === 0 && vy === 0)) {
    return 0;
  }
  return Math.atan2(vy, vx);
}

function composedProfileFor(weaponId: string): ComposableContentProfile | undefined {
  const registered = weaponRegistry.get(weaponId);
  if (registered?.execution.kind !== 'composed') return undefined;
  const profileId = registered.execution.modifiers?.[0];
  return profileId ? getComposableContent(profileId) : undefined;
}

function composedBase(profile: ComposableContentProfile | undefined): BaseProfile | undefined {
  if (!profile) return undefined;

  // Direct-fire composed content should read as bright tracer/kinetic fire rather
  // than stacking the legacy projectile's dark shell core at the muzzle. Values
  // stay intentionally compact because ComposedOverlay supplies the larger streak.
  const fanLike = profile.style === 'fan' || profile.style === 'wall';
  return {
    silhouette: 'kinetic',
    coreRadius: fanLike ? 1.15 : profile.style === 'tap' ? 1.75 : 1.35,
    glowRadius: fanLike ? 4.6 : 6.4,
    trailRadiusMin: fanLike ? 0.45 : 0.65,
    trailRadiusMax: fanLike ? 1.65 : 2.35,
    trailAlphaOld: 0.04,
    trailAlphaNew: fanLike ? 0.38 : 0.5,
  };
}

function weaponDefinitionFor(weaponId: string): WeaponDefinition | undefined {
  return (WEAPONS as unknown as Readonly<Record<string, WeaponDefinition | undefined>>)[weaponId];
}

export function getProjectileVisualProfile(
  projectile: Readonly<ProjectileState>,
): ProjectileVisualProfile {
  const weaponId = projectile.weaponType as unknown as string;
  const definition = weaponDefinitionFor(weaponId);
  const composition = composedProfileFor(weaponId);
  const legacyBase = (BASE_PROFILES as unknown as Readonly<Record<string, BaseProfile | undefined>>)[weaponId];
  const base = legacyBase ?? composedBase(composition) ?? FALLBACK_PROFILE;
  const isSubmunition = definition?.behavior?.airburst !== undefined && projectile.hasSplit;
  const scale = isSubmunition ? SUBMUNITION_SCALE : 1;

  return {
    ...base,
    silhouette: isSubmunition ? 'submunition' : base.silhouette,
    accent: definition?.detonation.color ?? composition?.color ?? '#d9f7ff',
    coreRadius: base.coreRadius * scale,
    glowRadius: base.glowRadius * scale,
    trailRadiusMin: base.trailRadiusMin * scale,
    trailRadiusMax: base.trailRadiusMax * scale,
    rotation: finiteRotation(projectile.vx, projectile.vy),
  };
}

import {
  getWeapon,
  WEAPONS,
  type WeaponType,
} from '@shared/engine/WeaponSystem';

export type MuzzleMotif =
  | 'needle'
  | 'heavy'
  | 'nuclear'
  | 'earth'
  | 'mine'
  | 'funky'
  | 'flame'
  | 'fan';

export interface MuzzleVisualProfile {
  motif: MuzzleMotif;
  accent: string;
  scale: number;
  sparkCount: number;
  spread: number;
  speedMin: number;
  speedMax: number;
  life: number;
}

type BaseMuzzleProfile = Omit<MuzzleVisualProfile, 'accent'>;

const BASE_PROFILES: Record<WeaponType, BaseMuzzleProfile> = {
  baby_missile: { motif: 'needle', scale: 0.9, sparkCount: 8, spread: 0.38, speedMin: 2.5, speedMax: 5.5, life: 7 },
  missile: { motif: 'needle', scale: 1, sparkCount: 9, spread: 0.4, speedMin: 2.7, speedMax: 5.8, life: 7 },
  heavy_missile: { motif: 'heavy', scale: 1.3, sparkCount: 12, spread: 0.48, speedMin: 2.8, speedMax: 6.2, life: 9 },
  baby_nuke: { motif: 'nuclear', scale: 1.35, sparkCount: 12, spread: 0.62, speedMin: 2.6, speedMax: 6.2, life: 9 },
  nuke: { motif: 'nuclear', scale: 1.75, sparkCount: 18, spread: 0.72, speedMin: 3, speedMax: 7.5, life: 12 },
  dirt_bomb: { motif: 'earth', scale: 1.15, sparkCount: 10, spread: 0.58, speedMin: 2.2, speedMax: 5, life: 9 },
  bouncing_betty: { motif: 'mine', scale: 1.1, sparkCount: 10, spread: 0.82, speedMin: 2.4, speedMax: 5.5, life: 8 },
  funky_bomb: { motif: 'funky', scale: 1.3, sparkCount: 14, spread: 1.05, speedMin: 2.5, speedMax: 6.5, life: 10 },
  napalm: { motif: 'flame', scale: 1.25, sparkCount: 11, spread: 0.5, speedMin: 2.4, speedMax: 5.8, life: 10 },
  cluster_bomb: { motif: 'fan', scale: 1.15, sparkCount: 13, spread: 0.9, speedMin: 2.4, speedMax: 6.2, life: 9 },
  mirv: { motif: 'fan', scale: 1.35, sparkCount: 15, spread: 0.95, speedMin: 2.6, speedMax: 6.8, life: 10 },
  deaths_head: { motif: 'fan', scale: 1.55, sparkCount: 18, spread: 1.05, speedMin: 2.8, speedMax: 7.2, life: 11 },
  riot_bomb: { motif: 'earth', scale: 1.05, sparkCount: 9, spread: 0.62, speedMin: 2.2, speedMax: 5.2, life: 8 },
  hot_napalm: { motif: 'flame', scale: 1.55, sparkCount: 15, spread: 0.58, speedMin: 2.7, speedMax: 6.5, life: 12 },
  sandhog: { motif: 'earth', scale: 1.25, sparkCount: 11, spread: 0.58, speedMin: 2.4, speedMax: 5.8, life: 9 },
  tracer: { motif: 'needle', scale: 0.8, sparkCount: 6, spread: 0.25, speedMin: 2.2, speedMax: 4.2, life: 6 },
  shield: { motif: 'needle', scale: 0.8, sparkCount: 6, spread: 0.3, speedMin: 2, speedMax: 4.5, life: 6 },
};

function isWeaponType(value: unknown): value is WeaponType {
  return typeof value === 'string' && Object.hasOwn(WEAPONS, value);
}

export function getMuzzleVisualProfile(weaponType: unknown): MuzzleVisualProfile {
  const type = isWeaponType(weaponType) ? weaponType : 'baby_missile';
  return {
    ...BASE_PROFILES[type],
    accent: getWeapon(type).detonation.color,
  };
}

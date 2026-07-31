import type { WeaponType } from '@shared/engine/WeaponSystem';
import {
  CircleDot,
  Drill,
  Flame,
  GitFork,
  Mountain,
  Radiation,
  Rocket,
  Share2,
  Shield,
  Skull,
  Sparkles,
  createElement,
} from 'lucide';

type WeaponFamily =
  | 'rocket'
  | 'nuclear'
  | 'terrain'
  | 'bounce'
  | 'volatile'
  | 'fire'
  | 'airburst'
  | 'mirv'
  | 'death'
  | 'drill'
  | 'defense';

interface WeaponGlyphDefinition {
  icon: typeof Rocket;
  family: WeaponFamily;
  tier: 0 | 1 | 2;
}

/**
 * Exhaustive, tree-shaken visual vocabulary for the shared weapon contract.
 * Related weapons deliberately reuse silhouettes; tier metadata supplies
 * controlled variation without turning the rail into fifteen unrelated marks.
 */
const WEAPON_GLYPHS = {
  baby_missile: { icon: Rocket, family: 'rocket', tier: 0 },
  missile: { icon: Rocket, family: 'rocket', tier: 1 },
  heavy_missile: { icon: Rocket, family: 'rocket', tier: 2 },
  baby_nuke: { icon: Radiation, family: 'nuclear', tier: 0 },
  nuke: { icon: Radiation, family: 'nuclear', tier: 2 },
  dirt_bomb: { icon: Mountain, family: 'terrain', tier: 0 },
  bouncing_betty: { icon: CircleDot, family: 'bounce', tier: 1 },
  funky_bomb: { icon: Sparkles, family: 'volatile', tier: 1 },
  napalm: { icon: Flame, family: 'fire', tier: 0 },
  cluster_bomb: { icon: Share2, family: 'airburst', tier: 1 },
  mirv: { icon: GitFork, family: 'mirv', tier: 1 },
  deaths_head: { icon: Skull, family: 'death', tier: 2 },
  riot_bomb: { icon: Mountain, family: 'terrain', tier: 2 },
  hot_napalm: { icon: Flame, family: 'fire', tier: 2 },
  sandhog: { icon: Drill, family: 'drill', tier: 2 },
  shield: { icon: Shield, family: 'defense', tier: 1 },
} satisfies Record<WeaponType, WeaponGlyphDefinition>;

export function makeWeaponIcon(type: WeaponType, size = 14): SVGElement {
  const definition = WEAPON_GLYPHS[type];
  return createElement(definition.icon, {
    class: 'st-weapon-icon',
    width: size,
    height: size,
    'stroke-width': 1.8,
    'aria-hidden': 'true',
    focusable: 'false',
    'data-weapon': type,
    'data-family': definition.family,
    'data-tier': definition.tier,
  });
}

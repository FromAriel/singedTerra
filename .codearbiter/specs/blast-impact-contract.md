# Blast Impact Contract

**Status:** Approved under the user’s scoped standing passion-project authority
**Issue:** #45, first independently playable slice
**Date:** 2026-07-25

## Problem

Blast weapons look larger than the area in which they deal damage. The renderer expands a normal
fireball to `1.8 * detonation.radius` and a cluster fireball to `1.4 * detonation.radius`, while the
engine reaches zero damage at exactly `detonation.radius`. A tank can therefore be visibly engulfed
by a fireball while taking no damage.

The mismatch also weakens low- and mid-tier weapons. A Baby Missile reaches zero damage only 18
logical pixels from its center even though its fireball reaches 32.4 pixels. A Missile reaches zero
at 30 pixels while its fireball reaches 54 pixels.

## Intent

Make the fireball an honest preview of blast reach and make glancing hits matter. The visible edge
of a blast is the zero-damage edge. Direct-hit damage, crater size, weapon inventory, prices,
projectile trajectories, and deterministic replay remain unchanged.

This is the first slice of issue #45. Field scale and accuracy tuning remain separate because they
change trajectories and require a broader playtest and fixture repin.

## Design

### Shared geometry

Create a DOM-free shared helper in `shared/src/engine/BlastGeometry.ts`:

```ts
import type { ExplosionStyle } from '../types/GameState';

export const BLAST_REACH = 1.8;
export const CLUSTER_REACH = 1.4;

export function blastReach(style: ExplosionStyle): number;
export function blastReachRadius(baseRadius: number, style: ExplosionStyle): number;
```

`blastReach('blast')` returns `1.8`; `blastReach('cluster')` returns `1.4`.
`blastReachRadius(radius, style)` returns `max(0, radius) * blastReach(style)`.

The renderer uses `blastReachRadius(b.radius, b.style)` as the full-grown fireball radius. The
engine uses the same value as the radius passed to `explosionDamage`. No consumer owns another
reach literal.

### Damage envelope

The existing linear falloff remains:

```text
damage = maxDamage * (1 - distance / damageRadius)
```

Only `damageRadius` changes:

```text
damageRadius = detonation.radius * styleReach
```

The resulting normal-blast examples are exact consequences of the existing formula:

| Weapon | Base radius | Peak damage | Damage at old edge | New zero edge |
|---|---:|---:|---:|---:|
| Baby Missile | 18 | 34 | 15.11 | 32.4 |
| Missile | 30 | 60 | 26.67 | 54 |
| Heavy Missile | 50 | 85 | 37.78 | 90 |
| Bouncing Betty | 30 | 55 | 24.44 per blast | 54 |
| Nuke | 90 | 100 | 44.44 | 162 |

Cluster-style weapons use `1.4`, matching their smaller rendered reach. Direct hits retain the
existing peak. Damage is still zero at and beyond the full-grown visible edge.

### Preserved geometry

`detonation.radius` continues to drive:

- terrain deformation and crater size;
- the base radius stored in `ExplosionEvent`;
- audio sizing, screen shake, bloom, and scorch sizing;
- weapon definitions and shop presentation.

Only proximity damage and fireball rendering consume the expanded reach helper.

### Special weapons

- Dirt Bomb and Riot Bomb keep `maxDamage: 0`; they remain damage-free.
- Napalm and Hot Napalm keep their current DOT-only path; their ignition flash does not gain impact
  damage.
- Shield has radius and damage zero and remains inert.
- Airburst and bouncing weapons apply the shared reach independently to each authoritative blast.

## Acceptance criteria

1. One shared source owns the exact normal and cluster reach multipliers.
2. Renderer full-grown radius and engine proximity-damage radius both use that source.
3. Normal blasts deal positive, formula-exact damage at their old base-radius edge.
4. Cluster blasts use the smaller `1.4` reach and deal positive damage at their old edge.
5. Damage is zero at and beyond the visible edge for both styles.
6. Direct-hit peak damage and crater radius remain unchanged.
7. Zero-damage and DOT-only weapons retain their existing damage behavior.
8. Identical seeds and action logs remain byte-identical across engine instances.
9. A DOM-free harness is wired into `npm run check` and kills independent engine-consumer,
   renderer-consumer, and style-mapping mutations.
10. Hot-seat visual playtest confirms that an engulfed tank receives damage and that the effect does
    not read as an invisible oversized hitbox.

## Non-goals

- No change to `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `POWER_SCALE`, gravity, wind, tank size, or spawn
  spacing.
- No weapon peak-damage, ammo, price, bundle, arms-level, duration, color, or trajectory change.
- No new setting, dependency, asset, backend function, migration, workflow, or remote Supabase
  mutation.
- No closure of issue #45. Its field-scale and broader time-to-kill playtest remain open.

## Verification

```powershell
npx tsx scripts/checks/blast_reach.mjs
npm run check
npm run test:client
npm run coverage:client
npm run check:edge
npm run build
npm run test:e2e
git diff --check
```

The focused harness must report exact geometry, damage-envelope, crater-preservation, special-weapon,
consumer-ownership, and replay-determinism proofs.

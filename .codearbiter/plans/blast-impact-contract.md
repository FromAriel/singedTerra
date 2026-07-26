# Blast Impact Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make blast damage reach the visible fireball edge through one deterministic shared
geometry contract.

**Architecture:** A pure shared helper owns style-specific reach. `GameEngine` passes the expanded
radius into existing linear damage math, while `Renderer` uses the same helper for its full-grown
fireball. Terrain deformation and event base radii remain unchanged.

**Tech Stack:** TypeScript, Canvas 2D, Node/tsx deterministic harnesses, npm workspaces

## Global Constraints

- Keep fixed-timestep physics and seed-plus-action-log replay deterministic.
- Preserve direct-hit peak damage and base-radius terrain deformation.
- Do not change field dimensions, trajectories, weapon definitions, economy, dependencies, backend,
  migrations, workflows, or remote state.
- `shared/` must not import from `client/`.
- Use TDD: focused RED before production edits, then GREEN and mutation proof.

---

## Obligation matrix

| ID | Obligation | Proof |
|---|---|---|
| O1 | Shared `blast=1.8`, `cluster=1.4` geometry | focused helper assertions |
| O2 | Renderer and engine use the shared helper | source-ownership and integration assertions |
| O3 | Positive, exact damage at the old edge | engine detonation assertions |
| O4 | Zero damage at the visible edge | engine detonation assertions |
| O5 | Peak damage and crater radius unchanged | direct-hit and terrain-byte assertions |
| O6 | Special weapons retain behavior | zero-damage and napalm assertions |
| O7 | Replay remains deterministic | paired-engine trace digest |
| O8 | Player-visible result reads correctly | hot-seat browser playtest |

## Task 1: Implement shared blast geometry with a causal oracle

**Files:**
- Create: `scripts/checks/blast_reach.mjs`
- Create: `shared/src/engine/BlastGeometry.ts`
- Modify: `package.json`
- Modify: `shared/src/engine/GameEngine.ts`
- Modify: `client/src/renderer/Renderer.ts`

**Interfaces:**
- Consumes: current `GameEngine`, `WEAPONS`, `damage`, terrain bitmap, renderer source
- Produces: a focused harness that first fails because `BlastGeometry.ts` does not exist, then a
  shared `blastReachRadius` contract consumed by engine damage and renderer visuals

- [x] **Step 1: Write the failing harness**

Create a DOM-free harness that imports:

```js
import {
  BLAST_REACH,
  CLUSTER_REACH,
  blastReach,
  blastReachRadius,
} from '../../shared/src/engine/BlastGeometry.ts';
```

Assert:

```js
BLAST_REACH === 1.8
CLUSTER_REACH === 1.4
blastReach('blast') === BLAST_REACH
blastReach('cluster') === CLUSTER_REACH
blastReachRadius(30, 'blast') === 54
blastReachRadius(30, 'cluster') === 42
blastReachRadius(-1, 'blast') === 0
```

Using a controlled `GameEngine` state and its actual `detonate` path, place a target’s body center:

- at a Missile’s base-radius edge and expect `26.6666666667` damage;
- at a MIRV warhead’s base-radius edge and expect `14.2857142857` damage;
- at each full visible edge and expect zero damage;
- at the center and expect the original peak;
- outside a Dirt Bomb, Riot Bomb, Napalm, and Shield path and prove no new direct damage.

Snapshot terrain bytes outside the base crater disc and prove they remain unchanged. Read
`Renderer.ts` and `GameEngine.ts` to prove both import and call `blastReachRadius`, and prove the
renderer no longer owns `1.8` or `1.4` reach literals.

- [x] **Step 2: Wire the focused harness**

Add `npx tsx scripts/checks/blast_reach.mjs` immediately after `flash.mjs` in the root `check`
script so a future visual or damage change cannot silently split the contract.

- [x] **Step 3: Run RED**

```powershell
npx tsx scripts/checks/blast_reach.mjs
```

Expected: non-zero exit because `shared/src/engine/BlastGeometry.ts` does not exist. Record the exact
failure in `.codearbiter/sprint-log.md`.

### Task 1 production pass: implement shared blast geometry

**Files:**
- Create: `shared/src/engine/BlastGeometry.ts`
- Modify: `shared/src/engine/GameEngine.ts`
- Modify: `client/src/renderer/Renderer.ts`
- Test: `scripts/checks/blast_reach.mjs`

**Interfaces:**
- Consumes: `ExplosionStyle`, existing `explosionDamage`, authoritative event base radius
- Produces: `BLAST_REACH`, `CLUSTER_REACH`, `blastReach`, `blastReachRadius`

- [x] **Step 1: Add the pure shared helper**

Implement:

```ts
import type { ExplosionStyle } from '../types/GameState';

export const BLAST_REACH = 1.8;
export const CLUSTER_REACH = 1.4;

export function blastReach(style: ExplosionStyle): number {
  return style === 'cluster' ? CLUSTER_REACH : BLAST_REACH;
}

export function blastReachRadius(baseRadius: number, style: ExplosionStyle): number {
  return Math.max(0, baseRadius) * blastReach(style);
}
```

- [x] **Step 2: Route engine damage through the helper**

In `GameEngine.detonate`, preserve:

```ts
deform(this.terrain, cx, cy, radius, raise)
event.radius = radius
```

Change only the proximity calculation:

```ts
const damageRadius = blastReachRadius(radius, style);
const baseDamage = explosionDamage(cx, cy, damageRadius, tank);
```

- [x] **Step 3: Route renderer reach through the helper**

Replace the renderer’s style conditional and literals:

```ts
const r = blastReachRadius(b.radius, b.style) * grow;
```

- [x] **Step 4: Run GREEN**

```powershell
npx tsx scripts/checks/blast_reach.mjs
npm run typecheck
```

Expected: focused contract passes and both workspaces typecheck.

- [x] **Step 5: Kill and restore causal mutations**

Independently mutate and restore:

1. `BLAST_REACH` from `1.8` to `1`;
2. `CLUSTER_REACH` from `1.4` to `1.8`;
3. `GameEngine` to pass base `radius`;
4. `Renderer` to multiply by an inline `1.8`;
5. terrain deformation to use `damageRadius`.

Each mutation must make the focused harness fail for its intended reason. Restore byte-exact
production code after every mutation and finish focused GREEN.

## Task 2: Playtest, review, and land

**Files:**
- Modify: `.codearbiter/plans/blast-impact-contract.md`
- Append: `.codearbiter/sprint-log.md`

**Interfaces:**
- Consumes: accepted T1/T2 artifacts
- Produces: reviewed, verified, deployable PR slice for issue #45

- [x] **Step 1: Run a hot-seat visual playtest**

Use the actual Vite app in hot-seat mode. Land a normal blast whose old damage disc misses but whose
fireball visibly overlaps a tank. Confirm visible damage feedback occurs. Use the deterministic
engine oracle—not animation-frame timing—to prove exact health preservation at and beyond the
full-grown fading edge for both normal and cluster blast styles.

- [x] **Step 2: Run focused review**

Review for:

- determinism and replay parity;
- shared/client layering;
- exact peak, falloff, and crater preservation;
- zero-damage and DOT-only special cases;
- renderer and engine consumer ownership;
- issue #45 slice scope.

Resolve every Critical, High, Important, or coverage gap before acceptance.

- [x] **Step 3: Run the fresh full matrix**

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

- [x] **Step 4: Harvest and commit**

Promote any low-confidence decision or `[NEEDS-TRIAGE]` finding, append final SMARTS/mutation/review
receipts, run the secret scan, stage only approved files, and commit through `$ca-commit`.

- [ ] **Step 5: Open, watch, merge, and deploy**

Open a ready PR that references issue #45 without closing it. Watch hosted CI and CodeQL. Under the
user’s standing authority, merge only when the PR is clean and every required hosted check is green.
Verify the Pages deployment provenance and live render smoke for the merge SHA. No Supabase
deployment is warranted because this slice changes no backend source.

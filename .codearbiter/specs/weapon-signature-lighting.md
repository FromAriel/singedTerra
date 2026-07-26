# Weapon-Signature Battlefield Lighting Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only Canvas lighting derived from existing local explosion events

## Intent

Make detonations feel embedded in the battlefield rather than painted over it. The current renderer
adds one warm full-screen flash regardless of weapon, so nearby terrain, tanks, fire, and projectile
layers do not visibly inherit the color or spatial position of the impact.

## Decision

Each live `Burst` will derive a bounded local-light profile from its existing exhaustive visual
family, authoritative accent color, shared reach, age, and lifetime. The centralized flash pass will
draw a weapon-colored radial light field around a small bounded set of the strongest simultaneous
bursts, followed by the existing subtle headline exposure flash.

- conventional impacts cast a compact warm pool;
- nuclear impacts cast the broadest, brightest sustained pool;
- earth impacts cast the tightest and dimmest pool;
- incendiary impacts cast a low, saturated pool;
- scatter impacts remain compact so multi-burst weapons do not wash out the field;
- funky impacts cast a vivid wider pool;
- mine impacts cast a short compact pool.

The light radius is an illumination falloff, not blast geometry. The fireball and all signature
primitives remain inside `blastReachRadius`; lighting may extend beyond that boundary but must fade
continuously to transparent and never mutate terrain, tanks, projectiles, or engine state.

## Acceptance

1. Every explosion visual family maps exhaustively to finite, bounded light spread and intensity.
2. Light alpha peaks at the start, remains bounded, and decays monotonically to exact zero.
3. Local-light radius derives from shared visual reach and is capped to a documented Canvas budget.
4. The renderer draws no more than three local lights per frame, selecting strongest candidates
   without mutating burst order or input state.
5. Each radial light uses the authoritative event accent and transparent falloff.
6. Nuclear, earth, incendiary, scatter, funky, mine, and conventional events produce observably
   different light profiles while the existing headline exposure flash remains compatible.
7. Canvas save/restore, composite mode, alpha, fill/stroke state, burst lifetime, dedupe, reset,
   reduced-motion behavior, and draw order remain intact.
8. No gameplay state, deterministic tick, network action, Supabase schema/function, dependency,
   workflow, or deployment-source contract changes.
9. Focused tests, mutation proof, deterministic checks, client coverage, Edge tests, build,
   browser guardrails, real-browser comparison, independent review, hosted CI, and exact-SHA Pages
   provenance are green before completion.

## Non-goals

- changing fireball reach, damage, crater geometry, weapon balance, or simulation timing;
- dynamic shadows, WebGL, shaders, bloom libraries, post-processing dependencies, or HDR;
- synchronizing cosmetic light state between clients;
- changing the global color palette, sky, terrain cache, tank art, HUD, lobby, or audio;
- deploying Supabase for a renderer-only change.

## SMARTS

Compared with continuously animated clouds, simulation-adjacent tank displacement, or a raster
asset pipeline, localized blast lighting has the strongest immediate payoff with the narrowest
architecture surface. It reuses the new exhaustive detonation profiles, stays inside one existing
Canvas pass, is measurable through stateful Canvas calls, remains reversible, and adds no runtime
or supply-chain dependency. Confidence: high.

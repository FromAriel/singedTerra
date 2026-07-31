# Projectile Ground Shadows Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only Canvas depth cues derived from live projectile and terrain state

## Intent

Make airborne ordnance read as occupying the battlefield rather than floating over a flat backdrop.
Weapon glyphs and trails now carry strong identity, but there is no visual relationship between a
shell and the deformable ground beneath it. A soft terrain-projected shadow gives every trajectory
height, scale, and contact with the scene without predicting the landing point.

## Decision

Each live projectile may cast one bounded, neutral ground shadow directly below its current `x`
position at the first solid terrain pixel in that column. A pure helper derives the ground point,
altitude, horizontal/vertical radii, and alpha from the authoritative projectile position and
current terrain bitmap.

- the cue is a present-position projection, never a future impact marker;
- near-ground shells cast compact, darker shadows;
- high shells cast wider, softer, fainter shadows;
- off-canvas, malformed, at/below-ground, or unusable terrain inputs produce no cue;
- airburst children each cast their own bounded cue after the split;
- shadows are drawn after terrain and before tanks/projectile glyphs so they seat into the world;
- the helper and drawing pass never mutate projectile or terrain state.

## Acceptance

1. A pure DOM-free helper returns finite bounded shadow geometry for a valid airborne projectile.
2. The ground `y` follows the live bitmap at the projectile's current horizontal column, including
   craters and raised terrain.
3. Increasing altitude makes the cue no darker and no narrower; all dimensions and alpha remain
   within documented caps.
4. Invalid, off-canvas, at-ground, below-ground, or malformed inputs fail closed with `null`.
5. The Canvas pass renders at most one neutral radial ellipse per live projectile, restores caller
   state, preserves input order/data, and never creates history.
6. The orchestration order is terrain, projectile ground shadows, visible tanks, then projectile
   trails/glyphs; buried-tank behavior remains intact.
7. Representative low, medium, high, crater, and split trajectories read clearly in a real browser
   without resembling predicted landing targets.
8. No engine tick, physics, collision, replay, network action, Supabase source, dependency,
   workflow, or deployment-source contract changes.
9. Focused tests, mutation proof, deterministic checks, client coverage, Edge tests, build,
   browser guardrails, real-browser comparison, independent review, hosted CI, and exact-SHA Pages
   provenance are green before completion.

## Non-goals

- predicted landing points, trajectory calculation, aim assistance, or gameplay markers;
- dynamic sunlight, physically based shadows, blur filters, WebGL, shaders, or new dependencies;
- changing projectile silhouettes, trails, velocity, collision, terrain, tanks, HUD, or audio;
- synchronizing cosmetic shadow state between clients;
- deploying Supabase for a renderer-only change.

## SMARTS

Compared with continuously animated ambient particles, broader sky repainting, or a sprite/asset
pipeline, projectile ground shadows improve both depth and trajectory readability through a small
existing Canvas seam. They reuse current projectile and terrain truth, have strict work and geometry
bounds, remain fully testable without timing or randomness, add no idle animation or dependency,
and cannot affect deterministic lockstep. Confidence: high.

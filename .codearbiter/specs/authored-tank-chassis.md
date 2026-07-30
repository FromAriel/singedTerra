# Authored Tank Chassis

**Status:** Approved under the standing passion-project sprint authority
**Date:** 2026-07-30
**Branch:** `codex/authored-tank-chassis`

## Problem

The battlefield now has an authored panorama and materialized terrain, but live
tanks are still assembled from small rectangles, circles, and a trapezoid.
They are the player-controlled focal points in every turn, so their flat
construction is now the clearest remaining seam in the graphical experience.

## Goal

Replace the live tank body, turret, and tread silhouette with one authored
raster chassis while preserving player identity, aim readability, damage
feedback, deterministic geometry, and the complete procedural fallback.

## Player contract

- Every living tank reads as a compact armored vehicle with a distinct hull,
  turret, tread, wheel, highlight, and shadow silhouette at gameplay scale.
- The same authored chassis takes on the tank's canonical player color, so red,
  blue, green, and yellow seats remain immediately distinguishable.
- The rotatable barrel, muzzle point, active-player beacon, shield, damage
  overlay, recoil, burial behavior, and contact with the terrain remain clear.
- Destroyed tanks retain the existing persistent wreck treatment.
- If the chassis cannot load or decode, the current geometric tank remains a
  complete fallback.

## Technical contract

- Generate one transparent-background, grayscale side-view tank chassis with no
  barrel, projectile, text, emblem, ground, cast shadow, smoke, or explosion.
- Optimize it as a 256 by 128 WebP at no more than 100,000 bytes. The visible
  silhouette must occupy enough of the frame to remain legible when drawn at
  36 by 24 logical pixels, keeping occupied art close to the established
  32-pixel procedural tread footprint.
- Add a presentation-only loader with loading, ready, and failed states,
  base-aware asset resolution, exact dimension validation, and a bounded
  fail-closed load deadline.
- Lazily build and cache one tinted offscreen variant per player color. Preserve
  authored luminance and transparency while mapping the neutral armor to the
  player's color.
- Draw the chassis at a named anchor relative to `tank.x` and `tank.y`. Keep the
  shared `BARREL_PIVOT_HEIGHT`, `BARREL_LENGTH`, `barrelTip()`, tank state, and
  collision dimensions unchanged.
- Keep the renderer active only until a ready chassis has been painted once.
  A failed request and a scene with no living chassis consumer must settle
  without permanent idle work.
- Resolve the asset through Vite's base URL at both root and GitHub Pages paths.

## Acceptance

- Asset checks prove WebP MIME, transfer budget, exact dimensions, meaningful
  transparency, non-flat luminance, and a bounded visible silhouette.
- Loader tests prove one image allocation, handler-before-source ordering,
  base-aware URL, dimension rejection, timeout settlement, late-callback
  rejection, and loading/error fallback.
- Tint-cache tests prove one offscreen allocation per unique color, repeat-draw
  reuse, luminance-preserving composition order, alpha masking, target anchor,
  and first-painted settlement.
- Tank integration tests prove ready art replaces only the live procedural
  chassis while the shared barrel endpoint, active beacon, damage overlay,
  recoil transform, buried ordering, and wreck path remain intact.
- Browser verification proves both player colors use the authored chassis, the
  left-facing Player 2 barrel remains correct, a fired/recoiling tank stays
  anchored, and every supported profile remains viewport-fitted.
- Existing deterministic, client, Edge, build, E2E, audit, and CodeQL gates
  remain green.

## Out of scope

- Tank collision, dimensions, placement, movement, physics, aim conventions,
  barrel geometry, weapon state, damage rules, network actions, Supabase,
  migrations, lobby preview art, wreck replacement, dependencies, lockfiles,
  merge, or deployment.

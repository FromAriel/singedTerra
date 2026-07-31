# Authored Battlefield Backdrop

**Status:** Approved under the standing passion-project sprint authority
**Date:** 2026-07-30
**Branch:** `codex/authored-battlefield-backdrop`

## Problem

The splash screen establishes a polished illustrated artillery world, but the
live battlefield still builds its far atmosphere from gradients, ellipses, and
polygon ridges. Those procedural shapes are efficient and coherent, yet the
quality step down is visible as soon as play begins.

## Goal

Put one high-quality authored raster panorama behind every live match while
preserving the fast, deterministic Canvas game and its current single-page
layout.

## Player contract

- Every hot-seat and networked match uses the same dusk-and-ember illustrated
  panorama behind the destructible battlefield.
- The panorama contains atmosphere and distant scorched mesas only. It has no
  baked tanks, projectiles, explosions, text, UI, sun, or foreground terrain.
- Live terrain, tanks, projectiles, wind cues, sun, lighting, impacts, and
  parallax remain code-driven and readable over the art.
- The background fills the logical 1200x600 Canvas without cropping, stretching,
  scrolling, or changing gameplay coordinates.
- If the image is unavailable or fails to decode, the current procedural
  atmosphere remains a complete fallback rather than showing a blank frame.

## Technical contract

- Generate one project-bound landscape bitmap in the existing singedTerra
  cel-painted/vector-pixel style, using the current indigo, violet, magenta,
  ember, and scorched-earth palette.
- Optimize the final asset as WebP and keep its decoded aspect ratio exactly 2:1.
- Add a small presentation-only backdrop loader with explicit loading, ready,
  and failed states. It owns no engine state and performs no per-frame
  allocation.
- While loading or failed, render the existing gradient, clouds, and ridges.
  When ready, render the bitmap over the gradient and replace only the
  procedural cloud/ridge layers; retain dynamic stars, sun, haze, wind, camera
  response, terrain, and effects.
- Keep the renderer active only until the image settles so an asynchronously
  completed load appears without defeating the existing idle-frame skip.
- Resolve the asset through Vite's base URL so GitHub Pages project paths and
  root-hosted deployments both work.

## Acceptance

- Asset checks prove the WebP exists, is 2:1, stays within a bounded transfer
  budget, and contains no accidental alpha hole.
- Loader tests prove one image allocation, exact fitted draw, loading fallback,
  ready state, failure state, and no engine mutation.
- Renderer seam coverage proves procedural clouds/ridges are replaced only when
  the authored asset is ready and that loading keeps the next redraw alive.
- Browser verification proves the art is visibly present, the game remains
  exactly viewport-sized at supported profiles, and HUD/tank/terrain contrast
  remains usable.
- Existing deterministic, client, build, Edge, E2E, and audit gates remain
  green.

## Out of scope

- Tank sprites, weapon sprites, HUD skins, fonts, animation video, parallax
  layer packs, multiple biomes, time-of-day selection, or procedural asset
  generation at runtime.
- Any shared-engine, action-log, Supabase, physics, layout, merge, deployment,
  dependency, or lockfile change.

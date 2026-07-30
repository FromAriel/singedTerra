# Atmospheric Battlefield Frame Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-29

## Problem

The fitted combat stage is intentionally wider than a typical desktop viewport.
It remains single-screen, but the unused top and bottom gutters read as empty
black space, while the current two translucent sky shelves are too faint and
geometric to provide convincing depth. The canvas art and combat rail therefore
feel more finished than the viewport that presents them.

## Goal

Make the whole browser viewport read as one dusk battlefield composition while
preserving the fitted, no-scroll game stage and the deterministic engine.

## Player-facing contract

- Letterbox space around the stage becomes an intentional token-driven
  atmosphere with dusk color, horizon warmth, and restrained texture.
- The in-canvas sky gains a clearly visible, cel-shaded ash-cloud field with
  near/far depth and warm horizon-facing rims.
- Clouds remain behind gameplay, terrain, tanks, projectiles, effects, and the
  HTML HUD. They never obscure controls or create input targets.
- The visual remains coherent on roomy desktop, compact touch, and small-window
  viewports. The page never scrolls and the complete stage remains visible.
- The existing reduced-motion behavior remains valid: the new atmosphere is
  static presentation, not perpetual animation.

## Technical contract

- Cloud geometry is fixed, bounded, and presentation-only. No clock, random
  number, engine state, replay state, action-log field, or Supabase value is
  introduced.
- Rich cloud drawing is cached rather than reconstructed on every renderer
  frame; impact parallax may translate the cached far layer with the existing
  depth profile.
- Browser framing consumes semantic CSS theme tokens rather than isolated raw
  colors.
- The renderer idle-skip contract is unchanged; a static aiming turn does not
  redraw solely for atmosphere.
- No third-party dependency is required. The existing Canvas 2D and CSS
  primitives are sufficient and keep the shipped surface smaller.

## Verification

- A focused RED/GREEN unit oracle pins deterministic bounded cloud geometry,
  depth ordering, and cache reuse.
- A production-browser oracle proves the full stage remains in the viewport,
  body scroll dimensions do not exceed the viewport, and the ambient frame is
  present at desktop, compact touch, and small-window sizes.
- The full deterministic, client, coverage, Edge, build, E2E, audit, diff, and
  secret gates pass before delivery.

## Out of scope

- Weather simulation, continuous cloud drift, or physics-affecting wind.
- Canvas resizing, world-coordinate changes, camera zoom, or HUD reflow.
- Raster background downloads, image-generation assets, WebGL, or a particle
  dependency.
- Merge, deployment, or Supabase changes.

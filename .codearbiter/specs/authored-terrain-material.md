# Authored Terrain Material

**Status:** Approved under the standing passion-project sprint authority
**Date:** 2026-07-30
**Branch:** `codex/authored-terrain-material`

## Problem

The authored panorama raises the quality of the far atmosphere, but the
destructible foreground remains a broad, mostly flat color ramp. Terrain fills
most gameplay frames, so the difference between the painted sky and the live
ground is now the most visible remaining art seam.

## Goal

Give every intact face, crater wall, and newly exposed earth layer a subtle
authored rock grain without changing what terrain means to gameplay.

## Player contract

- Live terrain reads as scorched, layered earth rather than a flat brown slab.
- The material remains subtle enough that tank silhouettes, crater boundaries,
  projectiles, fire, buried markers, and sidewall rails stay immediately clear.
- Explosions and Dirt Bombs continue to deform the exact authoritative bitmap;
  newly exposed pixels inherit the material on the next terrain rebuild.
- The existing lit rim, depth strata, and directional crater bevels remain the
  dominant structural cues.
- If the material image is unavailable or fails to decode, the current terrain
  renderer remains a complete fallback.

## Technical contract

- Generate one square, seamless, fully opaque neutral-rock texture with
  small-scale grain only. It contains no large cracks, craters, objects, text,
  directional light, or collision-like silhouettes.
- Optimize the asset as WebP at exactly 256 by 256 pixels and at most 100,000
  bytes.
- Add a presentation-only material loader with loading, ready, and failed
  states, a base-aware public URL, one decode surface, and a deterministic
  wrapped luminance sampler.
- Sample the material only during the existing terrain offscreen rebuild.
  Stable frames continue to perform one cached `drawImage` blit with no texture
  sampling or allocation.
- Preserve the terrain bitmap byte-for-byte. Material luminance may modulate
  existing RGB values within a named, bounded strength, but must not change
  alpha, the two-pixel lit rim, strata selection, or bevel direction.
- Keep the renderer eligible until a successfully decoded texture has been
  applied to one terrain rebuild. An explicit failure settles immediately into
  fallback; a request that never settles fails closed after a bounded deadline.
- Resolve the asset through Vite's base URL for root and GitHub Pages hosting.

## Acceptance

- Asset checks prove exact 256 by 256 dimensions, WebP MIME, transfer budget,
  full opacity, and enough luminance variation to produce visible grain.
- Loader tests prove one image and one decode-surface allocation, base-aware
  URL, deterministic power-of-two wrapping, pending-application lifecycle, and
  fail-closed behavior.
- Terrain tests prove a ready material changes solid RGB but never alpha or
  terrain bytes, leaves the lit rim unchanged, reuses the version cache after
  application, and rebuilds once when a texture becomes ready after fallback.
- Renderer coverage proves material loading keeps the next application frame
  eligible without creating permanent idle work, including when the image
  request never emits a terminal event.
- Browser verification proves the texture is visibly present after terrain
  deformation and the game remains viewport-fitted across supported profiles.
- Existing deterministic, client, build, Edge, E2E, and audit gates remain
  green.

## Out of scope

- Terrain collision, deformation, strata thresholds, terrain colors, damage,
  physics, gameplay coordinates, biome selection, parallax, or runtime
  procedural texture generation.
- Tank or weapon sprites, HUD skins, additional backgrounds, dependencies,
  lockfiles, Supabase, migrations, merge, or deployment.

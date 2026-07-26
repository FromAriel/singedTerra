# Terrain Silhouette Polish Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only graphical polish

## Intent

Make destructible terrain read as a richer illustrated surface instead of a raw binary bitmap,
without changing a single collision, deformation, collapse, replay, or network value.

## Decision

The client terrain texture will soften only solid boundary pixels during its existing
`terrainVersion`-gated offscreen rebuild. A pure coverage helper will inspect all eight neighboring
bitmap samples for exposed edges:

- fully surrounded solid pixels remain fully opaque;
- exposed solid edges remain strongly visible but gain partial alpha;
- out-of-bounds samples count as solid so the world frame never fades;
- air pixels remain fully transparent.

This is presentation only. The authoritative `Uint8Array` remains crisp and unchanged.

## Acceptance

1. Flat surfaces, slopes, crater rims, cave lips, and isolated debris lose harsh stair-step edges.
2. Interior terrain stays alpha `255`; air stays alpha `0`.
3. Edge opacity is bounded and monotonic with local solid coverage.
4. Canvas edges do not fade merely because neighbors fall outside the world.
5. `TerrainRenderer` applies the helper only while rebuilding its cached image.
6. Rendering does not mutate the terrain bitmap.
7. No shared engine, Supabase, dependency, lockfile, workflow, migration, or deployment code changes.
8. A behavioral renderer test inspects real rebuilt `ImageData`, not only source text.
9. Client tests, coverage, root deterministic checks, Edge tests, build, browser guardrails, review,
   hosted CI, and Pages provenance are green before completion.

## Non-goals

- anti-aliasing the authoritative collision bitmap;
- adding terrain materials, hazards, shaders, WebGL, or dependencies;
- changing terrain colors, generation, deformation radius, collapse, tank placement, or performance
  scheduling;
- adding time-based animation.

## SMARTS

Compared with weapon-specific particles and large-detonation camera kick, this slice is more
scalable (improves every battlefield state), maintainable (one pure helper), available (Canvas 2D
only), reliable (cached render path), testable (exact alpha contract), and securable (no data or
backend surface). Confidence: high.

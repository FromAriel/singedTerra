# Terrain Silhouette Polish Implementation Plan

**Goal:** Soften every destructible terrain boundary in the cached Canvas texture while preserving
the exact binary gameplay bitmap.

**Architecture:** A DOM-free pure helper computes alpha from local bitmap coverage.
`TerrainRenderer.rebuild` consumes it when writing solid pixels to its offscreen `ImageData`.

## Task 1: Define the causal edge contract

- [x] Add a focused Vitest that expects:
  - air `0`;
  - fully surrounded solid `255`;
  - flat and vertical edges the same bounded partial alpha;
  - a more exposed corner less opaque than a flat edge;
  - world-frame out-of-bounds samples treated as solid;
  - the input bitmap remains unchanged.
- [x] Run RED before the helper exists and record the exact failure.
- [x] Add `client/src/renderer/terrainEdges.ts` with the minimum pure implementation.
- [x] Run focused GREEN and kill/restore mutations for full-opacity edges and incorrect OOB handling.

## Task 2: Apply the contract to real terrain pixels

- [x] Add a behavioral `TerrainRenderer` test with a controlled offscreen `ImageData` seam.
- [x] Run RED while rebuilt solid pixels are still hardcoded alpha `255`.
- [x] Route rebuilt solid-pixel alpha through the pure helper.
- [x] Prove the offscreen cache still rebuilds only when `terrainVersion` changes.
- [x] Kill/restore a renderer bypass mutation.

## Task 3: Review, verify, and land

- [x] Run an actual browser playtest covering a slope and a fresh crater.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [x] Commit through the governed gate; open a ready PR.
- [x] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

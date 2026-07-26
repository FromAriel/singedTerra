# Terrain-Aware Debris Implementation Plan

**Goal:** Make render-only debris land on current terrain without changing simulation.

**Architecture:** A pure swept-collision helper advances one debris motion record against a
read-only bitmap. `EffectsRenderer` owns particle lifecycle and passes the latest terrain through
that helper; `Renderer` supplies the bitmap from `GameState`.

## Task 1: Define swept cosmetic collision

- [x] Add focused Vitest coverage for flat landing, chunk-bottom contact, multi-pixel sweep,
  unsupported resume, rising motion, empty space, bounds, and malformed inputs.
- [x] Run RED before the helper exists and record the causal failure.
- [x] Implement the minimum pure debris-motion helper.
- [x] Kill and restore collision-bypass, point-only, no-sweep, and no-resume mutations.

## Task 2: Wire real renderer terrain

- [x] Add a behavioral effects seam proving live debris receives terrain and settles while smoke,
  sparks, text, spawn counts/lifetimes, and reduced-motion behavior remain unchanged.
- [x] Run RED while `EffectsRenderer.update` is still terrain-blind.
- [x] Pass `GameState.terrain` from `Renderer.render` and use the helper only for debris.
- [x] Kill and restore a renderer terrain-wiring mutation.

## Task 3: Review, verify, and land

- [x] Run a real browser playtest that compares ejecta flight and terrain landing.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [x] Commit through the governed gate; open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

# Projectile Ground Shadows Implementation Plan

**Goal:** Give live ordnance a terrain-connected depth cue without predicting impact or changing play.

**Architecture:** A pure helper scans the current terrain column and maps altitude to a bounded
shadow profile. `ProjectileRenderer` paints those profiles without retaining state, and `Renderer`
places the pass between terrain and visible tanks.

## Task 1: Define the terrain-projection contract

- [x] Add focused tests for live-terrain projection, altitude scaling, bounds, invalid inputs, and
  immutability.
- [x] Run RED before the pure ground-shadow helper exists.
- [x] Implement the minimum immutable helper.
- [x] Kill and restore terrain-column, altitude, bounds, and fail-closed mutations.

## Task 2: Integrate the real Canvas pass

- [x] Add stateful Canvas assertions for one ellipse per cue, radial falloff, geometry, input
  preservation, split children, and caller-state restoration.
- [x] Run renderer RED while no shadow pass exists.
- [x] Draw ground shadows after terrain and before tanks/projectile glyphs.
- [x] Kill and restore helper-bypass, draw-order, per-projectile, and restore mutations.

## Task 3: Review, verify, and land

- [x] Compare low/medium/high, crater, and split trajectories through the real browser renderer.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [x] Commit through the governed gate; open a ready PR.
- [x] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

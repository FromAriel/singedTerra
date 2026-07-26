# Weapon-Signature Detonations Implementation Plan

**Goal:** Make impact effects unmistakably weapon-specific without changing gameplay truth.

**Architecture:** The deterministic engine adds its already-known `weaponType` to each local
`ExplosionEvent`. A pure client helper maps that provenance to bounded visual-family data, and the
existing centralized explosion pass composes family-specific Canvas layers inside the authoritative
blast reach.

## Task 1: Preserve weapon provenance at the event seam

- [x] Add deterministic tests for normal, airburst-child, chained Betty, and napalm ignition events.
- [x] Run RED while `ExplosionEvent` lacks `weaponType` and record the causal failure.
- [x] Add the field at both event constructors without changing action or backend contracts.
- [x] Kill and restore provenance-substitution mutations.

## Task 2: Define and render bounded visual families

- [x] Add focused tests for exhaustive profiles, bounds, authoritative colors, and immutability.
- [x] Run RED before the pure profile helper exists.
- [x] Add real Canvas seam assertions for distinct family primitives, exact outer reach, draw order,
  balanced Canvas state, lifecycle parity, and input immutability.
- [x] Run renderer RED while all bursts still use the generic radial treatment.
- [x] Implement the minimum family layers inside the existing centralized burst pass.
- [x] Kill and restore family-selection, reach, profile-bypass, and Canvas-state mutations.

## Task 3: Review, verify, and land

- [x] Compare every visual family in the real browser renderer and exercise representative impacts
  through real hot-seat play.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [x] Commit through the governed gate; open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

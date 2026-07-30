# Combat Readability Fidelity Implementation Plan

## Task 1: Pin the regressions before implementation

- [x] Add failing launch-guide tests for the exact shared muzzle, four-point
  opening collinearity, delayed flourish, and angle symmetry.
- [x] Add failing atlas/render tests that require tracks, articulated walker
  legs, and hover pods to have materially different gameplay-scale silhouettes.
- [x] Add failing HUD tests for full player identity and the two-level
  identity/tactical hierarchy at the reported rail width.

## Task 2: Author and integrate unmistakable vehicle families

- [x] Replace the atlas with authored Foundry Tracks, Ranger Walker, and
  Bulwark Hover families while preserving cell, ground-anchor, pivot, tint, and
  muzzle contracts.
- [x] Give the Garage propulsion controls descriptive visible labels and
  accessible names without changing the persisted loadout union.
- [x] Preserve deterministic cosmetic-only behavior and mixed-part rendering.

## Task 3: Repair launch and combat-state readability

- [x] Keep the opening launch-guide run coaxial with the shared barrel, delaying
  the non-ballistic flourish until after the opening samples.
- [x] Recompose the active-turn module into a full-width identity row and a
  fitted weapon/fuel/movement row.
- [x] Tune standard, compact, and touch styles without reintroducing scrolling
  or reducing pointer targets below the established HUD contract.

## Task 4: Review, verify, and deliver

- [x] Resolve all Critical, High, gameplay, rendering, accessibility,
  performance, security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate and open a ready PR.
- [ ] Prove exact-head hosted CI and CodeQL green, merge under standing
  authority, deploy Pages, and verify the public build.

# Weapon-Signature Muzzle Flashes Implementation Plan

**Goal:** Make launch visuals carry the same weapon identity as flight and impact.

## Task 1: Define the launch profile

- [x] Add exhaustive bounded pure-profile tests and run RED.
- [x] Implement the minimum weapon-to-muzzle profile helper.
- [x] Kill and restore family, bounds, and fallback mutations.

## Task 2: Integrate transient Canvas flashes

- [x] Add stateful Canvas and lifecycle assertions and run RED.
- [x] Derive the profile from the real first live projectile at the shared barrel tip.
- [x] Draw, age, cull, clear, and reduced-motion-gate the bounded effect.
- [x] Kill and restore profile-bypass, orientation, lifetime, and caller-state mutations.

## Task 3: Review, verify, and land

- [x] Compare representative launch families through the real browser renderer.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, full checks/coverage, Edge, build, E2E, diff hygiene, and secret scan.
- [x] Commit through the governed gate and open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then prove exact-SHA Pages deployment.

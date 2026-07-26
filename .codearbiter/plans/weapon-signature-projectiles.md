# Weapon-Signature Projectiles Implementation Plan

**Goal:** Give each weapon family an unmistakable in-flight visual identity without changing
gameplay.

**Architecture:** A pure profile helper maps authoritative projectile fields plus the shared weapon
definition to bounded presentation values. `ProjectileRenderer` applies those values to its
existing history trail and draws a small family-specific Canvas silhouette oriented along velocity.

## Task 1: Define the visual profile contract

- [x] Add focused Vitest coverage for the full weapon union, family distinctions, parent/child
  airburst scale, finite orientation, immutability, and bounded values.
- [x] Run RED before the profile helper exists and record the causal failure.
- [x] Implement the minimum pure profile helper.
- [x] Kill and restore family-selection, submunition-scale, and invalid-velocity mutations.

## Task 2: Draw signatures through the real renderer seam

- [x] Add behavioral Canvas coverage for trail color/size and each silhouette primitive while
  preserving history cleanup, discontinuity reset, and state immutability.
- [x] Run RED while `ProjectileRenderer` still draws the generic orange orb.
- [x] Wire the profile into the existing trail and shell pass with balanced Canvas state.
- [x] Kill and restore a renderer profile-bypass mutation.

## Task 3: Review, verify, and land

- [x] Run a real browser playtest comparing representative weapon families in flight.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [ ] Commit through the governed gate; open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

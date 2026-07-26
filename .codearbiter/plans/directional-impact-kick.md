# Directional Impact Kick Implementation Plan

**Goal:** Add bounded blast-origin-aware camera recoil to large explosions without changing game
simulation.

**Architecture:** A DOM-free pure helper derives the impulse vector. `Renderer` stores, composes,
decays, and resets that presentation-only impulse beside its existing shake state.

## Task 1: Define the recoil contract

- [x] Add a focused Vitest that expects threshold, monotonic scaling, cap, directional symmetry,
  center safety, and invalid-input safety.
- [x] Run RED before the helper exists and record the failure.
- [x] Add the minimum pure `impactKick` helper.
- [x] Run focused GREEN and kill/restore threshold, direction, and cap mutations.

## Task 2: Wire real explosion events

- [x] Add a behavioral renderer test proving `consumeExplosion` uses event position/radius, retains
  the strongest simultaneous impulse, and suppresses recoil under reduced motion.
- [x] Run RED while `Renderer` has no directional impulse state.
- [x] Compose and decay kick with existing shake; clear it on reset and expose it to `isAnimating`.
- [x] Kill/restore a renderer-wiring mutation.

## Task 3: Review, verify, and land

- [x] Run an actual browser playtest comparing a small blast and a heavy detonation.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [x] Commit through the governed gate; open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

# Fuel-Limited Movement Implementation Plan

## Task 1: Pin the deterministic contract

- [x] Add a failing movement harness for terrain traversal, partial steps, fuel
  accounting, bounds, tank collision, phase/liveness/burial gates, round reset,
  and Fuel Tank purchases.
- [x] Extend replay tests with ordered move actions and cross-engine parity.
- [x] Add failing referee tests for move shape, authorization, cursor neutrality,
  and exact committed payloads.

## Task 2: Implement engine, economy, and lockstep movement

- [x] Add the bounded move action to shared player and network contracts.
- [x] Implement one-pixel deterministic traversal in `GameEngine`.
- [x] Activate 100 starting fuel and add the canonical arms-level-3 Fuel Tank
  accessory through the engine, replay, client, and Edge referee.
- [x] Preserve round reset, turn, wind, aim, and action-log determinism.

## Task 3: Add fitted controls and feedback

- [x] Add failing input tests for discrete `A` / `D` movement with key-repeat
  suppression.
- [x] Add a semantic mobility rocker and authoritative fuel readout to the
  existing active-turn row.
- [x] Wire keyboard, pointer, and touch activation through the same action seam.
- [x] Add production-browser fit and no-scroll coverage at desktop, compact
  touch, and small-window sizes.

## Task 4: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, gameplay, lockstep, rendering,
  accessibility, performance, security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [ ] Commit through the governed gate.
- [ ] Open a ready stacked PR against
  `codex/atmospheric-battlefield-frame`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

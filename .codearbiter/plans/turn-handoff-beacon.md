# Turn Handoff Beacon Implementation Plan

**Goal:** Make the active player immediately legible within the existing fitted
combat rail.

## Task 1: Pin the handoff contract

- [x] Add failing HUD tests for owner identity, weapon context, CPU labeling,
  handoff emphasis, firing copy, accessible status, and stale-state clearing.
- [x] Add a failing production-browser oracle for visible ownership and
  unchanged single-screen geometry.

## Task 2: Implement the bounded beacon

- [x] Build the owner/weapon hierarchy inside the existing active row.
- [x] Synchronize team accent and accessible text from authoritative game state.
- [x] Retrigger one event-driven handoff emphasis and honor reduced motion.
- [x] Preserve desktop, coarse-pointer, compact, and small-window fit.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, security, and
  coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [ ] Open a ready stacked PR against `codex/toolchain-security-refresh`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

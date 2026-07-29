# Unified Fire Control Implementation Plan

**Goal:** Add one obvious, state-aware primary action to the fitted combat rail
without changing deterministic gameplay or duplicating controls on touch.

## Task 1: Pin the interaction contract

- [x] Add failing HUD tests for one shared action, projectile/shield labels,
  exactly-once activation, and disabled states.
- [x] Add failing ownership-gate tests for hot-seat human, CPU, local network,
  opponent network, and paused states.
- [x] Add failing production-browser geometry and live-fire oracles.

## Task 2: Implement the smallest complete control

- [x] Build the semantic rail action and remove the duplicate touch-only Fire
  button.
- [x] Synchronize label and enabled state from weapon, phase, firing, ownership,
  and pause state.
- [x] Wire the action through `InputHandler.triggerFire()` behind the existing
  local-input authority gate.
- [x] Fit desktop, coarse-pointer, compact, and small-window layouts.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, security, and
  coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [ ] Open a ready stacked PR against `codex/shareable-room-invites`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

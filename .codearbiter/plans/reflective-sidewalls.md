# Reflective Sidewalls Implementation Plan

**Goal:** Add deterministic, readable bank shots as one opt-in room rule.

## Task 1: Pin the shared wall contract

- [x] Add failing engine-path coverage for open misses, left/right reflection,
  repeated contacts, bounded flight, and wall-contact events.
- [x] Add the normalized room/state wall mode and pure sidewall reflection.
- [x] Thread wall handling through live projectiles, clone, replay, and AI search.

## Task 2: Make the rule visible and configurable

- [x] Add failing renderer/effects/audio tests for static rails, contact flashes,
  dedupe, and reduced motion.
- [x] Add failing hot-seat and online lobby/transport/Edge option-plumbing tests.
- [x] Implement the Canvas rails and procedural ricochet feedback.
- [x] Implement setup, room persistence, validation, rejoin, and rematch plumbing.
- [x] Replace collision-accurate opening solutions with one bounded,
  non-authoritative launch vector following playtest feedback.
- [x] Share the live flight cap with AI probing and prove low-gravity bank parity.
- [x] Point fresh/new-round tanks toward their nearest opponent.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, performance,
  security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, rendering E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [x] Open a ready stacked PR against `codex/material-impact-signatures`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

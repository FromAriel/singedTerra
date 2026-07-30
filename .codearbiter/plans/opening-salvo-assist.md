# Opening Salvo Assist Implementation Plan

**Goal:** Turn the first shot of a match into an intuitive, visually rich
ballistics lesson without weakening later-turn skill.

## Task 1: Pin the trajectory and renderer contract

- [x] Add failing pure tests for fixed-step trajectory samples, ground/tank
  collision, wind, room gravity, bounded misses, invalid inputs, and immutability.
- [x] Add failing renderer tests for opening-rotation eligibility,
  direct-flight eligibility, ownership/preference gating, draw ordering, and
  short-guide fallback.
- [x] Add a failing production-browser oracle for visible/moving/disappearing
  opening guidance and unchanged fitted geometry.

## Task 2: Implement the bounded assist

- [x] Add a pure sampled-trajectory helper that reuses shared launch,
  integration, and swept-collision primitives.
- [x] Thread the current effective room gravity through the existing local aim
  guide seam.
- [x] Render the static opening arc, collision bracket, and compact label inside
  the world pass; preserve the current short guide outside eligibility.
- [x] Keep all tuning in named constants and preserve idle-skip behavior.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, performance,
  security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [x] Open a ready stacked PR against `codex/fuel-limited-movement`.
- [x] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

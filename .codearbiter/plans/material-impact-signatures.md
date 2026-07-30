# Material Impact Signatures Implementation Plan

**Goal:** Give direct armor hits and terrain impacts distinct, bounded feedback
while preserving deterministic gameplay.

## Task 1: Pin authoritative material provenance

- [x] Add failing engine-path coverage for ground, tank, napalm, bounce-contact,
  and air/flight-cap explosion provenance.
- [x] Add the optional explosion material contract and thread exact swept
  collision results into detonation events.
- [x] Prove deterministic replay and clone/state serialization remain stable.

## Task 2: Build the presentation signatures

- [x] Add failing pure tests for bounded material audio profiles and batch
  coalescing.
- [x] Add failing renderer/effects tests for terrain ejecta, armor fragments,
  `DIRECT HIT`, reduced motion, and audio routing.
- [x] Implement procedural terrain/armor audio under the existing explosion.
- [x] Implement bounded armor fragments and readout without changing the main
  weapon burst, damage text, or shield effects.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, performance,
  security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, rendering E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [x] Open a ready stacked PR against `codex/opening-salvo-assist`.
- [x] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

# Fire Control Console Implementation Plan

**Goal:** Replace the compact numeric fallback and flat three-cell row with one
prominent responsive analog fire-control console.

## Task 1: Pin the restored console contract

- [x] Add failing unit oracles for semantic layout, wide wind geometry, single
  analog representation, and live labels.
- [x] Change browser guardrails to require visible analog instruments at every
  supported scale.

## Task 2: Build and inspect the console

- [x] Restructure the existing SVG gauges into a two-tier ballistic console
  without changing gauge math or authoritative state.
- [x] Strengthen bezels, tracks, labels, and compact-scale legibility without
  continuous animation.
- [x] Compare the production HUD in a real browser at normal and compact scale.
- [x] Correct the direction transform, match the primary dial geometry, and
  keep compact-stage defaults free of an inner scrollbar.

## Task 3: Review, verify, and land

- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, full checks/coverage, Edge, build, E2E, diff hygiene,
  and secret scan.
- [x] Commit the behavior through the governed gate.
- [x] Open a ready PR.
- [x] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

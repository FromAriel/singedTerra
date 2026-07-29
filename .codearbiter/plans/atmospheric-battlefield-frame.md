# Atmospheric Battlefield Frame Implementation Plan

## Task 1: Pin the visual contract

- [x] Add failing cloud-profile tests for deterministic bounded geometry,
  near/far depth, and warm-rim semantics.
- [x] Add a failing renderer oracle for cache reuse and draw ordering.
- [x] Add a failing production-browser oracle for atmospheric gutters,
  full-stage fit, and zero scrolling.

## Task 2: Build the atmosphere

- [x] Introduce one small render-only cloud profile module.
- [x] Replace the faint polygon shelves with a cached cel-shaded cloud field.
- [x] Extend the theme-token vocabulary to the full-viewport battlefield frame.
- [x] Preserve static idle behavior, impact parallax, and reduced motion.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, rendering, accessibility,
  performance, security, and coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [ ] Commit through the governed gate.
- [ ] Open a ready stacked PR against `codex/turn-handoff-beacon`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

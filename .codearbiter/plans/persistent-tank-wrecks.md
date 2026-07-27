# Persistent Tank Wrecks Implementation Plan

**Goal:** Make elimination leave an honest, readable battlefield silhouette.

## Task 1: Pin the wreck contract

- [x] Add a stateful Canvas oracle for the dead branch and run RED.
- [x] Prove the intact turret/barrel and active treatment are absent.
- [x] Preserve caller state and live-tank characterization.

## Task 2: Implement and tune

- [x] Add the minimum deterministic wreck branch in `TankRenderer`.
- [x] Kill and restore branch, owner-remnant, and intact-geometry mutations.
- [x] Compare healthy, damaged, and dead states through the real browser.

## Task 3: Review, verify, and land

- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, full checks/coverage, Edge, build, E2E, diff hygiene, and secret scan.
- [ ] Commit through the governed gate and open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then prove exact-SHA Pages deployment.

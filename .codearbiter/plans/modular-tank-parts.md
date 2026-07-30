# Modular Tank Parts Implementation Plan

### Task 1: Shared mount and slot contract

- [x] Write failing tests for four exhaustive slots, stable source rectangles,
  surface anchoring, and authoritative pivot-to-muzzle distance.
- [x] Implement the default part-set data and aim-guide muzzle continuity.
- [x] Run focused geometry and guide tests.

### Task 2: Authored default assembly

- [x] Generate, normalize, and validate coherent treads, hull, turret, and barrel
  art in one transparent bounded atlas.
- [x] Write failing loader/painter and renderer integration tests.
- [x] Assemble and tint all four slots with exact loading/error fallback.

### Task 3: Production proof and governed delivery

- [x] Prove aim-guide continuity, part visibility, tint, and fit in production
  Chromium across all viewport profiles.
- [x] Complete one adversarial review and correct every Critical/High finding.
- [x] Run the complete local gate.
- [ ] Commit, open a ready PR, and require exact-head hosted green.

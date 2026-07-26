# Weapon-Signature Battlefield Lighting Implementation Plan

**Goal:** Make each detonation illuminate the battlefield with its own spatial color and weight.

**Architecture:** A pure DOM-free helper maps the existing explosion visual family, reach, age, and
lifetime to a bounded local-light profile. `Renderer.drawFlash` selects at most three strongest live
bursts, draws their radial additive light fields, and retains the existing single headline exposure
flash.

## Task 1: Define the bounded lighting contract

- [x] Add focused tests for exhaustive families, bounds, monotonic decay, caps, and invalid inputs.
- [x] Run RED before the pure lighting helper exists.
- [x] Implement the minimum immutable profile/envelope helper.
- [x] Kill and restore family, cap, and decay mutations.

## Task 2: Integrate the real Canvas pass

- [x] Add stateful Canvas assertions for color, radial falloff, strongest-three selection, draw
  order, reduced motion, input immutability, and caller-state restoration.
- [x] Run renderer RED while the flash remains one global warm fill.
- [x] Draw bounded local lights before the existing headline exposure flash.
- [x] Kill and restore selection, profile-bypass, composite, and restore mutations.

## Task 3: Review, verify, and land

- [x] Compare representative weapon families through the real browser renderer and hot-seat play.
- [x] Resolve all Critical, High, Important, or coverage findings.
- [x] Run focused tests, `npm run check`, client suite and coverage, Edge suite, build, E2E, diff
  hygiene, and secret scan.
- [ ] Commit through the governed gate; open a ready PR.
- [ ] Merge only after clean hosted CI/CodeQL, then verify exact-SHA Pages provenance and live smoke.

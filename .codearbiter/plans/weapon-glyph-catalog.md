# Weapon Glyph Catalog Implementation Plan

### Task 1: Exhaustive visual vocabulary

- [x] Write failing tests that require every `WeaponType` to resolve to stable
  weapon/family metadata and decorative SVG geometry.
- [x] Implement an explicit tree-shaken weapon-glyph map and factory.
- [x] Run focused unit tests and typecheck.

### Task 2: Arsenal and Store integration

- [x] Add shared glyphs to weapon buttons and Store rows without changing
  labels, ammo, ownership, prices, callbacks, or state.
- [x] Add compact family/tier styling through combat-UI tokens.
- [x] Prove real-browser fit and interaction across all viewport profiles.

### Task 3: Governed delivery

- [x] Complete one adversarial review and correct every Critical/High finding.
- [x] Run the applicable complete local gate.
- [x] Commit, open a ready PR, and require exact-head hosted green.

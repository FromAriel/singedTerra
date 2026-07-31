# Combat Iconography Implementation Plan

**Goal:** Replace generic utility imagery with a coherent, compact artillery
command glyph system without changing combat-rail geometry or behavior.

**Tech stack:** TypeScript, DOM SVG, Lucide, semantic CSS tokens, Vitest,
Playwright.

### Task 1: Pin semantic iconography

- [x] Write failing tests for ordnance/credits semantics, exact bomb/coin
  geometry, framed primary glyphs, unframed disclosure, visible labels, and
  decorative accessibility.
- [x] Replace `PackageOpen` and `ShoppingBag` with tree-shaken `Bomb` and
  `Coins`; add stable semantic metadata and a reusable glyph factory.
- [x] Run focused unit tests and typecheck.

### Task 2: Apply the command-glyph treatment

- [x] Wrap Menu, Store, Fire, and Arsenal through the shared factory.
- [x] Add semantic glyph tokens and one compact framed treatment; keep the
  disclosure chevron unframed.
- [x] Verify desktop, touch-landscape, and small-window fit in the production
  browser with no scroll or interaction regression.

### Task 3: Review and governed delivery

- [x] Run one adversarial subagent review and correct every Critical/High
  finding.
- [x] Run the complete applicable local gate.
- [x] Commit, open a ready PR, require exact-head hosted CI/CodeQL, and merge
  under standing authority.

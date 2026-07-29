# Single-Screen Combat Shell Implementation Plan

**Goal:** Establish a reusable visual foundation and convert the right-side HUD
into one fitted combat rail with a non-scrolling arsenal drawer.

## Task 1: Pin the shell and drawer contract

- [x] Add failing unit oracles for shared section semantics, drawer state,
  accessible actions, exact icon use, and unchanged weapon selection.
- [x] Replace the browser scroll-hint expectation with collapsed and expanded
  zero-overflow geometry in every viewport project.

## Task 2: Vet the asset vocabulary

- [x] Complete the license, provenance, lifecycle-script, transitive-runtime,
  maintenance, and bundle-cost review for the exact Lucide version.
- [x] Log the SMARTS comparison against local SVGs and CVA, then install only
  the approved exact package version.
- [x] Build a small exact-import icon seam with decorative accessibility
  defaults; never import or register the complete icon catalog.

## Task 3: Build and inspect the combat shell

- [x] Add semantic surface, separator, typography, spacing, focus, and action
  tokens plus reusable shell/section/action classes.
- [x] Flatten the six competing widget frames into one continuous rail while
  preserving control order and the ballistic computer's hierarchy.
- [x] Convert the arsenal to a bounded opaque drawer that never participates
  in rail height.
- [x] Document the system and its intentional exceptions.
- [x] Compare production desktop, small-window, and compact-touch layouts in a
  real browser, including keyboard focus and expanded arsenal geometry.

## Task 4: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, dependency, or coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [x] Open a ready stacked PR against `codex/instrument-panel-restoration`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

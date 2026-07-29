# Toolchain security refresh implementation plan

## Task 1: Pin the baseline and vet targets

- [x] Capture the full `npm audit --json` advisory paths.
- [x] Map each vulnerable package to its direct parent with `npm ls`.
- [x] Verify target licenses, upstream repositories, Node engines, registry
  signatures, provenance attestations, integrity hashes, and lifecycle scripts.
- [x] Record the dependency decision in the approved sprint spec.

## Task 2: Refresh the isolated toolchain

- [x] Update Vite to 6.4.3 and Vitest/coverage to 4.1.10.
- [x] Refresh compatible transitive packages.
- [x] Avoid an override: the clean Vitest 4 graph resolves patched transitives.
- [x] Inspect manifest and lockfile diffs; reject unrelated package drift.
- [x] Prove the resolved tree and audit are clean.

## Task 3: Verify compatibility

- [x] Run deterministic/typecheck checks.
- [x] Run the full client unit and coverage suites.
- [x] Run all Edge Function tests.
- [x] Run the production build and compare the static runtime dependency surface.
- [x] Run the full Playwright suite.
- [x] Obtain independent dependency and compatibility review.

## Task 4: Governed delivery

- [x] Update dependency documentation and close the existing audit task.
- [x] Append exact evidence and SMARTS decisions to the sprint log.
- [x] Run diff hygiene, secret scan, and the full commit gate.
- [x] Commit and open a ready stacked PR against `codex/unified-fire-control`.
- [x] Require exact-head hosted CI and CodeQL success; do not merge or deploy.

# Toolchain security refresh

## Problem

A fresh registry audit on 2026-07-28 reports nine advisories in the existing
development toolchain: two critical, four high, and three moderate. The affected
paths are Vite/Vitest, PostCSS, brace-expansion, and shell-quote. These findings
block the sprint commit gate even though none of the packages ship in the static
game bundle.

## Scope

- Upgrade the existing Vite, Vitest, and Vitest coverage packages to the lowest
  currently patched compatible releases.
- Refresh vulnerable transitive packages through their declared compatible
  ranges.
- Use a root npm override only where the direct parent pins a vulnerable
  transitive version and no patched parent release exists.
- Keep the application, engine, Supabase contract, gameplay, and production
  dependency graph unchanged.
- Update dependency documentation and close the existing dependency-audit task.

## Dependency decision

Vite 6.4.3, Vitest 4.1.10, and `@vitest/coverage-v8` 4.1.10 are existing-tool
upgrades, not new capabilities. All three are MIT licensed, published from their
established upstream repositories, carry npm registry signatures and SLSA
provenance attestations, declare Node 20 support, and expose no install lifecycle
scripts. The lockfile must record exact integrity hashes.

The initial Vitest 3.2.6 candidate still depended on `test-exclude` 7 and
`glob` 10, whose `brace-expansion` 2.x line has no release outside the newest
OOM advisory. Vitest 4.1.10 is therefore the first verified clean graph and is
compatible with Vite 6 and the repository's pinned Node 20 runtime.

## Acceptance criteria

1. `npm audit --audit-level=high` reports zero vulnerabilities.
2. `npm ls` reports a valid tree with the intended Vite/Vitest versions and only
   patched brace-expansion, PostCSS, and shell-quote releases.
3. `npm run check`, client tests and coverage, Edge tests, production build, and
   the complete Playwright suite pass.
4. Coverage does not fall below the repository gate and existing test semantics
   require no weakening.
5. The static production bundle contains no new runtime dependency.
6. Independent dependency and compatibility review returns no blocking finding.
7. No `--force`, install-script approval, application code, workflow, migration,
   backend deployment, merge, or deployment is performed.

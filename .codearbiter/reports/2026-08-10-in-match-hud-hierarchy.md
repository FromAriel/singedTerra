# Delivery receipt: in-match HUD decision hierarchy

Date: 2026-08-10

## Outcome

The combat rail now presents the active turn as one decision sequence: identify the acting tank and weapon, read elevation, power, and wind, then commit the primary action. The roster and collapsed Arsenal remain available as secondary regions. Pending submission, shot flight, terrain resolution, and terminal states preserve that hierarchy across desktop, compact, and touch layouts.

## Delivered history

- Feature commit: `cb35ff422e17d56b30f030942e45ff93716b80a1`.
- Coverage correction commit: `7d8af3dbee4f6397393b39443474ece4dcc6f645`.
- Pull request: [#376](https://github.com/SUaDtL/singedTerra/pull/376).
- Guarded reviewed head: `7d8af3dbee4f6397393b39443474ece4dcc6f645`.
- Merge commit on `main`: `2a012254c549c6725dba7b704efa22e5fd34a75f`.

## Test-first and review evidence

- Initial shell assertions failed while the instruments remained a top-level sibling instead of part of the Turn Command Console.
- Browser failures exposed stale coarse-pointer order rules and a touch-specific visibility collision. The corrected rail passed desktop, Pixel landscape touch, and compact fine-pointer profiles.
- Mutations proved the tests reject restoring instruments outside the console, restoring roster before the console, moving Arsenal earlier on touch, removing identity hiding during shot progress, and retaining progress through a terminal transition.
- The final exact package, SHA256 `051E1A3DD68D5F5D094451BE0F9C3F062A259C5E21490080A75C42C21C7726C4`, contained the spec, plan, sprint evidence, tests, mutation evidence, and complete staged diff.
- The adversarial reviewer and coverage auditor both returned CLEAR with no remaining Critical, High, Medium, Low, or merge-blocking findings.

## Verification

- `npm run check`: green.
- Client suite: 148 files, 1,138 tests passed.
- Edge suite: 267 passed.
- Dependency audit: zero vulnerabilities.
- Fixture-configured production build and typecheck: green.
- Full browser matrix: 246 passed, 30 intentional profile skips.
- Canonical staged secret scan: no findings.
- Hosted CI run `31377226886`: typecheck, harnesses, build, Edge, and rendering E2E green on the exact reviewed head.
- Hosted CodeQL run `31377226884`: analysis green on the exact reviewed head.

## Deployment and production health

- GitHub Pages run `31377598160` built the client, verified current `main`, deployed, verified provenance, and passed post-deploy live render smoke.
- Direct production health returned HTTP 200 with the application mount present.
- Production `deploy-meta.json` reported SHA `2a012254c549c6725dba7b704efa22e5fd34a75f` and run `31377598160`.
- No Supabase function, migration, authentication, persistence, or dependency source changed; no Supabase deployment was required.

## Next selected improvement

Continue the persisted adversarial player-experience backlog with one decisive mobile landscape handoff, replacing the separate splash and orientation gates before play.

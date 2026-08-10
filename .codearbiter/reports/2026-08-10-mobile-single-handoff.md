# Delivery receipt: mobile single handoff

Date: 2026-08-10

## Outcome

An initial phone-portrait visit now presents the authored orientation launch bay as the sole pre-play handoff. Rotating once to landscape enters the lobby directly. Phone landscape, wider portrait viewports, desktop, and later orientation changes preserve the existing splash behavior, while `OrientationGate` remains the single owner of focus, inertness, fullscreen, and orientation state.

## Delivered history

- Feature commit: `559352a96299c2c234f5deb10cf0cb690a55eb4b`.
- Pull request: [#378](https://github.com/SUaDtL/singedTerra/pull/378).
- Guarded reviewed head: `559352a96299c2c234f5deb10cf0cb690a55eb4b`.
- Merge commit on `main`: `040dc3f158dafe3dfee1447089052b4ade87cda9`.

## Test-first and review evidence

- The unit RED proved the initial phone-portrait media query was not consulted and the splash still mounted.
- The browser RED produced nine failures because the splash remained stacked with the orientation launch bay.
- The corrected focused suite passed six unit assertions and eighteen initial-state browser assertions before the final journey expansion.
- Mutations proved coverage rejects removing the skip, weakening the exact query to orientation-only, requiring a launch action before rotation can release the lobby, and reactively removing a landscape-owned splash after later portrait entry.
- Zero-action portrait-to-landscape and reverse landscape-splash-to-portrait journeys passed in all three browser profiles.
- The final exact review package, SHA256 `9B71130148FD5B5438C4B954A429D73C2D91992099AC9D7A26CB8AF187A3D762`, contained the spec, plan, sprint evidence, tests, mutation evidence, and complete staged diff.
- Designated adversarial reviewer Parfit (`019feb37-2da7-79c0-b97f-ae6f505726a2`) re-read corrected package `9B71130148FD5B5438C4B954A429D73C2D91992099AC9D7A26CB8AF187A3D762` and returned CLEAR after verifying both original Medium blockers were resolved; its final counts were Critical 0, High 0, Medium 0, accessibility/responsive/interaction/governance blockers 0, and other merge blockers 0.

## Verification

- `npm run check`: green.
- Client suite: 148 files, 1,140 tests passed.
- Edge suite: 267 passed.
- Dependency audit: zero vulnerabilities.
- Fixture-configured production build and typecheck: green.
- Full browser matrix: 252 passed, 30 intentional profile skips.
- Canonical staged secret scan: no findings.
- Hosted CI run `31380335176`: typecheck, harnesses, build, Edge, and rendering E2E green on the exact reviewed head.
- Hosted CodeQL run `31380335074` and exact-head CodeQL check `93429136139`: green.
- CodeRabbit: green on the exact reviewed head.

## Deployment and production health

- GitHub Pages run `31380674558` built the client, verified current `main`, deployed, verified provenance, and passed post-deploy live render smoke.
- Direct production health returned HTTP 200 with the application mount present.
- Production `deploy-meta.json` reported SHA `040dc3f158dafe3dfee1447089052b4ade87cda9` and run `31380674558`.
- No Supabase function, migration, authentication, persistence, or dependency source changed; no Supabase deployment was required.

## Next selected improvement

Continue the persisted adversarial player-experience backlog with the remaining visible progression milestone: make the post-match XP result name the next concrete player-visible aspiration without weakening server-owned progression.

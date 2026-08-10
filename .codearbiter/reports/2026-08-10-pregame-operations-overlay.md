# Delivery receipt: pre-game operations overlay

Date: 2026-08-10

Scope: The account record and Advanced Settings now use a shared modal layer instead of entering the preparation-board document flow. The layer preserves the underlying stage geometry, contains keyboard focus, restores focus on close, and keeps hot-seat and online configuration regions aligned at supported desktop and compact sizes.

## Test-first evidence

- Account and Advanced Settings route tests failed first because the controls still rendered in the preparation-board flow.
- Overlay lifecycle tests failed first until backdrop close, Escape close, cyclic focus, background inertness, inert restoration, and opener focus restoration were implemented.
- Browser geometry tests failed first until the overlay root used fixed viewport positioning and the online operation controls remained visible and non-overlapping.
- Causal mutations proved the inert-restoration and fixed-position assertions fail when their production behavior is removed.

## Verification

- `npm run test:client`: 145 files, 1093 tests passed.
- `npm run check`: passed, including deterministic harnesses and typechecking.
- `npm run check:edge`: 267 tests passed.
- `npm run audit:deps`: no high-severity vulnerabilities.
- `npm run build`: passed.
- Isolated production-bundle Playwright: 234 passed, 30 skipped.
- The canonical security scanner's three H-10b matches were reviewed as inert test literals and the standard HTML `new-password` autocomplete value. The user explicitly authorized the exact staged security override, and the sanctioned line-bound security pass reported zero sensitive lines.

## Review and delivery

- The adversarial exact-final-diff package included the spec, plan, sprint evidence exception, tests, and final diff.
- Auth and security reviewers reported no Critical, High, or merge-blocking findings.
- The coverage reviewer initially found two High proof gaps. Both were resolved with causal inert-restoration and fixed-position browser assertions, then the reviewer cleared the corrected diff with no merge block.
- Two non-blocking Medium follow-ups remain: directly exercise online Advanced Settings value persistence across close and reopen, and add explicit coverage for the single-column branch below 700 pixels.
- PR #370 merged as `364ca111a60d2713ee32a3b4cdf68b8b1e27f3e5` after CI run `31357073395`, CodeQL run `31357073381`, CodeRabbit, hosted rendering checks, and local gates passed on reviewed head `e157b5b85a445706bc1d6e198aeadca73e4eebaf`.
- GitHub Pages run `31357340240` passed build, current-main verification, deployment provenance, and post-deploy live smoke. Direct production health returned HTTP 200, and `deploy-meta.json` reported the exact merge SHA and Pages run ID.
- No Supabase source changed, so no backend deployment was required.

## Next selected slice

- Add one obvious Quick Duel versus CPU path from the pre-game experience so a player can reach the core artillery loop without configuring a full operation. This is the highest-value remaining player-retention finding from the adversarial experience audit.

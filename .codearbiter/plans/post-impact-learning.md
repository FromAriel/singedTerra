# Plan: post-impact learning feedback

Date: 2026-08-10

## SMARTS decision

| Option | Scope safety | Learning value | Mobile fit | Determinism safety | Reuse | Total |
|---|---:|---:|---:|---:|---:|---:|
| Add cue inside the existing Impact Monitor | 19 | 19 | 18 | 20 | 19 | 95 |
| Add a separate DOM toast below the HUD | 15 | 17 | 11 | 20 | 10 | 73 |
| Add shot-result state to the deterministic engine | 6 | 18 | 16 | 7 | 12 | 59 |

Selected: cue inside the existing Impact Monitor. It is the narrowest reversible change, preserves one visual focus, and does not expand the replay or network contract.

## Test-first sequence

1. Add failing pure tests for target selection, signed/wrap-aware miss distance, direct-hit and near-line language, same-team exclusion, malformed data, and local-shot eligibility.
2. Implement the smallest pure cue derivation helper.
3. Add failing painter tests for the two cue lines at normal and compact scale, then implement bounded in-frame rendering.
4. Add failing renderer integration tests for local shooter capture, cue attachment to the selected burst, reset, and remote/CPU suppression.
5. Wire the helper through burst admission and monitor selection without changing engine state.
6. Run focused mutation checks for reversed correction direction, non-wrap distance under wrap mode, same-team targeting, disconnected painter wiring, and lost local ownership.
7. Run focused and full verification, build the exact review package, dispatch one adversarial reviewer, and resolve every merge blocker.
8. Exit through `$ca-commit` and `$ca-pr`, require green hosted checks on the exact reviewed head, merge with an expected-head guard under standing authority, verify Pages provenance and production health, and persist a delivery receipt.

## Sprint obligations

- Keep the slice presentation-only and bounded to impact-learning helpers, monitor painting, renderer wiring, tests, and governance artifacts.
- Record every non-hard correction with SMARTS evidence; do not read or rewrite the malformed canonical sprint log.
- Preserve the existing monitor when cue context is unavailable.
- Do not touch deferred cleanup or unrelated worktrees.

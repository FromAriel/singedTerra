# Plan: in-match HUD decision hierarchy

Date: 2026-08-10

## SMARTS decision

| Option | Decision clarity | Scope safety | Cross-viewport value | Behavioral risk | Reuse | Total |
|---|---:|---:|---:|---:|---:|---:|
| Consolidate identity, instruments, and action into one console; demote roster | 20 | 19 | 19 | 18 | 18 | 94 |
| Auto-collapse the desktop Command Deck after first shot | 15 | 16 | 10 | 13 | 15 | 69 |
| Reduce roster to active player and nearest opponent | 16 | 8 | 16 | 7 | 10 | 57 |

Selected: consolidate the full current-turn decision sequence. It changes hierarchy rather than availability and leaves every control contract intact.

## Test-first sequence

1. Record the current shell/instrument/primary-action baseline.
2. Add failing shell tests for command-console ownership and exact decision/rail order.
3. Add a failing browser geometry assertion for identity → instruments → primary action, with roster after the console.
4. Make the smallest DOM composition change and adapt direct-child CSS to the nested instrument surface.
5. Strengthen console-versus-secondary visual hierarchy without changing hit targets or behavior.
6. Run focused mutations that restore the old instrument or roster placement and prove the new tests fail.
7. Run focused, full client, deterministic, Edge, dependency, build, and cross-viewport browser verification.
8. Package spec, plan, sprint evidence, tests, mutation evidence, and exact diff for one adversarial reviewer; resolve every blocker.
9. Exit through `$ca-commit` and `$ca-pr`, require exact-head hosted green, guarded merge, Pages provenance, production health, and a persisted receipt.

## Sprint obligations

- Use the ignored UTF-8 sprint ledger because the canonical historical sprint log remains byte-preserved under its recorded malformed-UTF-8 exception.
- Preserve all existing controls and interaction behavior.
- Do not touch unrelated worktrees or deferred cleanup.

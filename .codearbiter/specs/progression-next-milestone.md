# Post-match progression milestone sprint spec

**Status:** approved under the standing improvement-goal authority
**Date:** 2026-08-10
**Task:** `mvp2.progression.0008`
**Decision basis:** adversarial player-experience audit item 5

## Goal

Turn the victory report's generic `Progression recorded` acknowledgement into an immediate, honest reason to play again: show the accepted match XP and name the next visible level milestone from the refreshed server-derived account summary.

## SMARTS decision

Three bounded routes were considered:

1. Add rewards or unlocks. This could create stronger aspiration, but it crosses the existing entitlement and result-integrity reopen triggers and is too large for this slice.
2. Add a second client-owned progression calculation. This is fast but weakens the existing server-owned trust boundary and can drift.
3. Recommended: after a signed-in hot-seat result is accepted and the account summary refreshes, pass the validated version-1 summary into the existing victory receipt and render the earned XP plus `XP to Level N`.

Route 3 is specific, measurable in unit/composition/browser tests, achievable without backend changes, relevant to the audit's final remaining finding, time-bounded to one client slice, reliable because the level state remains server-derived, maintainable through one typed receipt contract, testable through exact text and stale-refresh cases, available without new services, and scalable because future progression versions can replace the formatter deliberately.

## Acceptance criteria

1. A recorded signed-in hot-seat win shows `+200 XP` and the exact remaining XP to the next level in the already-open after-action report.
2. A recorded signed-in hot-seat non-win shows `+100 XP` and the exact remaining XP to the next level.
3. The milestone uses the refreshed validated account summary; a failed, missing, stale, malformed, or superseded refresh must not claim an XP amount or level milestone.
4. Anonymous, AI-owned Player 1, networked, E2E-fixture, and duplicate terminal observations retain their existing no-receipt/no-write behavior.
5. The receipt remains a polite live status inside the real modal, introduces no extra action, and fits desktop and compact/touch layouts without overlap.
6. Account state, XP, level, and outcomes remain read-only client data sourced from the existing authenticated result and `account_summary` paths. No schema, Edge Function, auth, migration, dependency, or gameplay change is allowed.
7. RED tests and adversarial mutations prove the formatter, refreshed-summary handoff, win/non-win amounts, stale-refresh suppression, and terminal-generation guard.
8. Full local verification, exact-package adversarial review, exact-head hosted checks, merge, Pages deployment, and production provenance all clear before completion.

## Out of scope

- Rewards, unlocks, achievements, ranks, seasons, leaderboards, currencies, or gameplay advantages.
- A new progression formula or version, persistent XP writes, or database work.
- Network-match progression, anonymous progression, account onboarding, or Google SSO.
- Changes to match outcome authority, lockstep simulation, weapons, economy, or rematch behavior.

## Reopen triggers

- Any reward or unlock requires a separately reviewed entitlement design and stronger result-integrity analysis.
- Any formula change requires a new progression version.
- Network progression requires a separately scoped server-result linkage slice.

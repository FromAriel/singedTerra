# Pre-game Player Identity

**Task:** `ux.menu.0006`
**Status:** approved by the standing improvement goal

## Decision

SMARTS ranked three reversible presentation approaches:

1. Restyle the expanded account card. Low effort, but identity and earned progress remain hidden until a player opens a floating panel.
2. Add a compact authenticated player record that stays visible in every pre-game route, while retaining the existing disclosure for detailed stats and sign-out. Selected: high player value, low behavioral risk, and no backend work.
3. Build a dedicated progression hub. Higher future value, but it adds navigation and product decisions before the pre-game journey is coherent.

## Scope

For an authenticated player, the pre-game shell must continuously show Commander identity, current level, and current XP progress in a compact Player Record treatment. Activating that record must preserve the existing disclosure behavior and detailed record: matches, recorded wins, level, precise XP, close, and sign-out.

The compact record must use semantic progress markup with a precise accessible name. It must remain legible and reachable in Hot Seat and every Online route at desktop, touch, and constrained-window layouts. Anonymous, loading, unavailable, and authenticated-error behavior stays truthful and functionally unchanged.

## Exclusions

No changes to Supabase Auth, credentials, account session ownership, progression writes, RLS, migrations, gameplay, room transport, or dependencies. This is not a progression hub or an in-match HUD change.

## Acceptance Criteria

1. An authenticated, collapsed account surface contains a Player Record with commander name, level, and a semantically labelled XP meter; it has no duplicate IDs and does not expose sign-out or account forms until opened.
2. Opening the record retains the full detailed account summary and existing action callbacks exactly once.
3. The record is visually part of the tactical pre-game command shell, has a stable heading or landmark label, and does not overlap or create stage/document overflow at supported viewport classes.
4. Anonymous and account-error states retain their present controls and safe text handling.
5. Unit and production-bundle browser tests fail before the new contract, then prove it on desktop, touch, and small-window layouts.

## Verification

Run targeted AccountPanel and Lobby account tests, the full client suite, the deterministic harness, production build, dependency audit, staged-file secret scan, and browser coverage for the Player Record plus existing account/garage layout guards. Provide an adversarial exact-diff package with this spec, its plan, test results, final diff, and the H-05 sprint-log exception.

## Governance

ADR-0011 and ADR-0012 remain authoritative for password auth and owner-private progression. H-05 applies: `.codearbiter/sprint-log.md` is malformed UTF-8 and must not be read, written, or appended; this slice records its evidence in the PR and review package instead.

# Quick Duel versus CPU

Date: 2026-08-10
Owner: SUaDtL
Approval: Standing continuous-improvement goal approval for bounded specs and plans

## Problem

The pre-game experience asks a new player to choose Hot Seat or Online and configure a match before the game demonstrates its core artillery loop. The adversarial player-experience audit identifies this setup friction as the highest-value remaining reason a first-time player may leave.

## Outcome

Add one prominent `Quick Duel vs CPU` action to the shared command shell. One activation starts a standard local match between the current primary human commander and one medium CPU opponent. No setup form, network request, account requirement, confirmation screen, or new dependency is involved.

## Design

- The action is a distinct 46px immediate-action briefing inside the mode rail, immediately before the Hot Seat / Play Online tablist. The briefing and tablist share one horizontal command row in desktop and compact logical layouts. It remains visible while either route is selected because it is an alternative to both setup routes.
- The human seat uses the current first local player's trimmed name, color, and normalized authored loadout. A blank name falls back to `Player 1`, and any CPU flag on that working row is removed.
- The CPU seat is named `CPU 1`, uses medium difficulty, receives the first palette color not used by the human, and uses the authored second-seat loadout.
- The emitted configuration is `mode: 'hotseat'` with exactly two players and no advanced `settings`, so engine defaults govern the duel.
- Existing Hot Seat, Online, rejoin, account, progression, first-salvo, and Supabase contracts remain unchanged.

## Acceptance criteria

1. The ordinary lobby renders exactly one visible button named `Quick Duel vs CPU` inside a distinct mode-rail briefing immediately before the Hot Seat and Play Online setup controls.
2. Activating it calls the existing lobby-ready seam exactly once with a two-seat hot-seat configuration: one human, one medium CPU, unique colors, normalized loadouts, and no settings override.
3. The action ignores invalid or incomplete secondary setup rows and remains available after switching to Play Online.
4. A production-bundle browser test proves the action is reachable at every configured viewport and enters a running game with a visible HUD and CPU opponent.
5. The action has a minimum 46 CSS-pixel height, remains within the lobby frame, creates no document overflow, and uses the existing squared command visual language.
6. No Supabase, migration, authentication, persistence, deterministic engine, or dependency file changes.

## Out of scope

- Difficulty selection, rules presets, player-name onboarding, matchmaking, rewards, or a confirmation modal.
- Replacing the full pre-game information architecture.
- Changing AI behavior or game balance.

## SMARTS decision record

| Candidate | Scope fit | Player value | Evidence | Reversibility | Risk | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Immediate shell action | 5 | 5 | 5 | 5 | 4 | Selected. It reaches the core loop in one activation without duplicating setup. |
| Third Quick Duel tab | 3 | 4 | 3 | 4 | 3 | Rejected. A tab still implies another route and adds setup navigation. |
| New landing-page mode chooser | 1 | 4 | 2 | 3 | 2 | Rejected for this slice. It expands into the broader menu overhaul. |
| Same-row mode-rail correction | 5 | 5 | 5 | 5 | 5 | Selected in fix round 2/5. It preserves the briefing contract while removing the 51–55px grid-row regression proven by comparative production runs. |

Confidence: high. The user endorsed the adversarial audit ordering, the current lobby already exposes a stable hot-seat ready seam, and the change is client-only and reversible.

Fix round 2/5 is approved under the standing bounded-spec/plan authority. Comparative production evidence established that the pre-Quick-Duel client passes the three garage suites 23/23 with one expected skip, while the dedicated Quick Duel grid row introduces five overflow failures. Sharing the existing mode-rail row is the narrowest reversible correction; no separate approval pause is required.

## Governance note

The repository's sprint-log marker-root is under a previously recorded malformed UTF-8 exception. This slice must not read or write that file; SMARTS evidence is recorded here instead.

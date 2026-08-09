# Pre-game Command Shell

**Task:** `ux.menu.0005`
**Status:** approved by the standing improvement goal
**User intent:** The complete experience before a match must feel like the same polished post-apocalyptic artillery game as the battlefield, not a bright, rounded, cheerful web form.

## Decision

Three routes were considered.

1. Retheme only the existing primary buttons. This is low effort, but leaves equal-weight information, disconnected account treatment, and mismatched subviews intact.
2. Establish one command-preparation shell across every pre-game lobby state while preserving the existing interaction contracts. This changes visual hierarchy, grouping, and responsive rhythm together without risking room, account, or match behavior.
3. Replace the lobby with a new multi-screen navigation application. This offers the greatest structural freedom, but duplicates stable behavior and delays the visible correction.

**SMARTS:** route 2 is strong. It is reliable because all callbacks and state owners stay in place; maintainable because shared shell and action rules replace one-off styling; testable through existing DOM contracts plus production-browser geometry; available because it adds no backend or loading dependency; scalable because every lobby subview inherits the same language; and aligned with the explicit player-experience request. Route 1 fails the user-visible outcome. Route 3 is disproportionate for a first independently shippable foundation.

## Scope

Create a single tactical **command-preparation** language across the complete pre-game lobby surface:

- Lobby title, vehicle bay, rejoin notice, mode selection, mode context, and keyboard control legend.
- Hot Seat setup, player roster, colors/controllers, Garage entry and editor, advanced settings, validation, and Start Game.
- Online create, join-by-code, public-room browse, waiting room, room code/invite, ready state, and route alternatives.
- Account entry, sign-in/create-account controls, authenticated commander summary, XP progress, and sign-out/close controls.

The resulting surface uses a dark fire-control/field-command tone: crisp rectangular controls, restrained brass/ember highlights, technical labels, deliberate panel boundaries, and a clear primary command with subordinate alternatives. It must remain recognizably singedTerra and preserve the existing vehicle artwork rather than introducing a new asset set.

## Explicit exclusions

- No changes to gameplay, deterministic simulation, match start payloads, room transport, callbacks, persistence, Supabase, Auth, RLS, migrations, or dependencies.
- No in-match HUD, pause menu, between-round Store, or victory report rewrite. Those are not pre-game surfaces and require their own coordinated slices.
- No new remote assets, generated raster art, telemetry, or product copy outside the lobby.

## Acceptance criteria

1. Every pre-game state named in Scope presents one coherent command-preparation visual system rather than rounded, equal-weight application controls. Primary actions are visually unmistakable; alternate and destructive/exit actions remain visibly subordinate.
2. The shell exposes a stable, accessible pre-game heading and keeps the existing accessible names, keyboard tab behavior, focus behavior, validation text, and callbacks for mode selection, account, Garage, room routes, room actions, and Start Game.
3. Account and progression are an integrated commander-status panel, not a competing floating card; unauthenticated, loading, error, authenticated, and compact states stay contained and usable.
4. Desktop-fine, pixel-touch landscape, and small-window production bundles keep Hot Seat, Online create/join/browse/waiting, the Garage compact path, account entry, and every primary/alternate action inside the lobby stage with no horizontal or vertical overflow. Touch targets and reduced-motion behavior remain covered.
5. Existing network and hot-seat behavior remains byte-for-byte / callback equivalent: no room request shapes, configuration values, persistence, or gameplay behavior change.

## Verification

- Start with failing DOM/E2E assertions for the command shell and the pre-game visual/geometry invariants.
- Run focussed Lobby shell, account, Hot Seat, Online-view, Garage, and route-action tests during TDD.
- Run a production-bundle Playwright matrix across desktop-fine, pixel-touch, and small-window for all pre-game states named above.
- Before delivery: full client tests, `npm run check`, `npm run build`, `npm run audit:deps`, secret scan, exact-final adversarial review, exact-head hosted CI, Pages deployment, and public provenance/health verification.

## Governing records

- Conform to ADR-0004: menu/HUD presentation remains DOM/CSS over the canvas.
- Conform to ADR-0011/ADR-0012: existing password Auth and its account lifecycle are presentation inputs only; this slice does not alter trust boundaries.
- The known H-05 malformed `.codearbiter/sprint-log.md` must not be read, appended, or edited. This spec and plan are the durable decision record for this slice.

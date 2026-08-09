# Pre-game Deployment UX Foundation

**Task:** `ux.pregame.0001`
**Status:** approved by the standing improvement goal

## Player Problem

The screens before a match still read as unrelated friendly web panels. Rounded controls, generic tabs, a persistent decorative vehicle bay, and route-specific layouts make Hot Seat, Online, account, garage, and room setup feel assembled rather than authored as one game. The player should feel they are preparing a deployment, not filling out a cheerful form before a different product begins.

## SMARTS Decision

The user explicitly prioritized the complete pre-game experience. SMARTS compares a CSS-only recolor, a shared deployment-shell foundation, and a wholesale rewrite of every setup form. The shared shell scores best for player value per effort: it changes the first impression and hierarchy across every pre-game route now, establishes durable design ownership for later Garage/Store/room slices, and preserves the tested operational behavior beneath it.

## First Slice

Replace the shared pre-game shell with a field-deployment command surface used by Hot Seat and every Online sub-route. It must establish one visible information hierarchy:

1. A concise masthead identifies the game and current preparation state.
2. A mode rail clearly selects local or online deployment with keyboard-safe tab semantics retained.
3. A mission brief names the selected route, states the immediate objective, and keeps the next primary action visually dominant.
4. The vehicle bay supports the current preparation context instead of competing with navigation and forms.
5. Account identity, return-to-match, controls legend, setup controls, garage, and Store access retain their existing behavior and remain reachable.

The visual system uses the existing dark battlefield palette, squared hardware-like controls, restrained gold/ember emphasis, and a consistent boundary treatment. It removes the rounded, bright generic-panel reading from the shared shell and makes the start route feel continuous with the battlefield.

## Acceptance Criteria

1. Hot Seat plus the Online create, join, browse, and waiting views render inside one named deployment shell with a masthead, tablist, mission brief, contextual vehicle bay, and controls legend.
2. Primary route selection preserves current click, Arrow, Home, End, focus, role, `aria-selected`, and `aria-controls` behavior. Online route actions and a validated rejoin route preserve their current outcomes.
3. A route with one immediate commitment exposes exactly one visually dominant primary next action. Secondary route choices remain available but cannot visually compete with it. Browse keeps rooms as mutually exclusive choices, so every row-level Join action is deliberately secondary rather than arbitrarily promoting one room.
4. The common shell uses a single squared command treatment for primary navigation and actions. Compact supported layouts retain physically reachable primary controls, a fitted frame, no document overflow, and no overlap between account/preview/navigation regions.
5. Existing account, Hot Seat configuration, Online room, vehicle Garage, Store, and match-start behavior do not change. No gameplay, network, persistence, Auth, Supabase, dependency, or migration change is in scope.
6. Unit coverage proves the deployment landmark/order and preserves tab/rejoin semantics. Production-bundle browser coverage proves the shared shell, one primary route action, and responsive reachability on desktop, Pixel touch, and small-window projects.

## Explicit Exclusions and Follow-ups

This first slice does not redesign individual form fields, garage editing, account flows, Store catalog content, room protocol, or match gameplay. Follow-up slices will use the same shell to reshape the detailed preparation surfaces after the shared hierarchy is stable.

## Verification

Use a failing shell unit test and a failing production-bundle browser assertion before implementation. Verify the three supported viewport projects, full client suite, deterministic/Edge checks, build, dependency audit, staged secret scan, exact-final-diff adversarial review, exact-head hosted CI, Pages deployment, and live provenance. H-05 applies: do not read or edit `.codearbiter/sprint-log.md`.

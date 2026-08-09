# Online Lobby Action Hierarchy

Task: `ux.menu.0004`

## SMARTS decision

The explicit menu-overhaul request ranks ahead of unrelated backlog work. Live production inspection shows that Play Online explains its purpose, but its Create, Join, and Browse routes remain a flat button row. A small client-only hierarchy pass has high player reach, removes an immediate choice ambiguity, and is reversible without changing room behavior. The canonical sprint log cannot be safely appended because of the documented H-05 broken-UTF-8 defect; this spec records the decision without bypassing that exception.

## Problem

After choosing Play Online, a player sees three equal-feeling room-entry routes. The primary intent of the current subview is mixed with its alternatives, while labels such as "instead" make the route system read as a collection of scattered escape hatches rather than one deliberate choice flow.

## Decision

The Create and Join by Code forms keep their current action as a visually separate primary route, followed by one labelled, semantic group of alternate routes. Browse retains its existing per-room Join actions as the primary choices and adds the same alternate-route group beneath the room list. Create remains the default route; Join by Code and Browse remain available alternatives. Existing callbacks, input values, busy gates, room requests, and routes remain exactly as they are.

## Acceptance criteria

1. Create and Join by Code each render one primary route action before a labelled `navigation` group named `Other ways to play online`; Browse retains its per-room Join actions and renders that group beneath the list.
2. The alternative group exposes only the two other routes, with direct, stable labels: `Create a room`, `Join with a code`, and `Browse public rooms`; no route is labelled `instead`.
3. Existing create, join, browse, busy/disabled, and input-canonicalization callbacks preserve their exact behavior and invoke once per click.
4. The primary action remains visually distinct; alternatives are grouped beneath it without overlapping, clipping, document overflow, or unreachable controls on desktop, landscape-touch, or compact views.
5. No engine, action protocol, room transport, Supabase/Auth, persistence, dependency, migration, secret, or gameplay behavior changes are allowed.

## Evidence plan

Start with failing DOM tests for the reusable action hierarchy and every route's callback/disabled contract. Extend the existing real-browser lobby guardrail for each route across its viewport projects. Run focused and full client tests, deterministic checks, build, and the relevant browser guardrails. Give an adversarial reviewer this spec, plan, H-05 sprint-log exception, tests, and exact final diff; resolve all blocking findings before exact-head hosted CI, guarded merge, Pages deployment, and production provenance verification.

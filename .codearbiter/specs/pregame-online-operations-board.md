# Pre-game Online Operations Board

## Objective

Bring the Browse Rooms and Waiting Room stages into the tactical pre-game
language so online play reads as one deliberate operation from room discovery
through readiness, without changing room transport or readiness behavior.

## Scope

- Turn Browse Rooms into an operations board with a route title, concise
  purpose, named room-list section, clear empty state, and per-room join action
  that remains the only primary commitment for that row.
- Turn the Waiting Room into a staging board with a route title, mission-code
  section, named roster section, direct readiness state, and one clear Ready Up
  commitment alongside secondary copy-invite and Leave controls.
- Replace new or affected generic inline presentation with shared tactical
  classes that respect the existing dark squared command surface.
- Preserve the existing room-list request, join-by-code/create alternatives,
  room-code copy action, readiness/leave callbacks, busy and clash gates,
  Garage/self-edit access, and all accessible names that drive the live flow.
- Add causal DOM and production-bundle geometry coverage for Browse and
  Waiting across supported desktop and compact landscape projects.

## Out of scope

- Create Room and Join Room deployment briefs, room protocol, Supabase,
  Auth, persistence, migrations, dependencies, assets, gameplay, and Garage
  internals.

## Acceptance criteria

1. A player can identify that Browse shows open operations and that Waiting is
   the staging area for their specific room before parsing individual rows.
2. Browse preserves each room's exact metadata and enabled/disabled Join
   behavior, while alternatives remain reachable and secondary.
3. Waiting preserves copy-invite, roster, self-edit, clash warning, Ready Up,
   waiting, busy, and Leave behavior, with Ready Up still the single primary
   commitment when available.
4. Both surfaces fit the fixed stage without heading, roster, room rows, or
   primary actions overlapping or escaping at supported desktop and compact
   landscape sizes.
5. Tests prove real labels, callbacks, disabled states, and measured layout
   relationships rather than only static classes.

## SMARTS record

The explicit whole-menu-overhaul request ranks this work first. Browse and
Waiting are the only remaining online transition surfaces still composed as
generic stacked copy with inline presentation, so one client-only journey pass
has high visible reach and no protocol risk. The work is reversible, bounded to
two builders plus shared Lobby CSS, and directly follows the deployment-brief
pattern. Confidence: high.

## Constraints

- Test first. Do not alter room requests, callbacks, data shapes, or gameplay.
- Reuse existing visual tokens and the fixed-stage shell. Add no dependencies.
- Do not read or modify `.codearbiter/sprint-log.md`; H-05 malformed UTF-8
  remains active.

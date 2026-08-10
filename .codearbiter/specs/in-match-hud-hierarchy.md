# Spec: in-match HUD decision hierarchy

Date: 2026-08-10

## Outcome

The combat rail should present the active turn as one decision sequence: identify the acting tank and weapon, read elevation/power/wind, then commit the primary action. Match roster and arsenal remain available but visually and structurally secondary.

## Behavior

- One `Turn command console` contains, in order, the active tank/weapon row, the Ballistic Computer, shot-progress status, and the Store/primary-action row.
- The primary action remains the last decision inside that console and retains its existing single-dispatch, disabled-state, keyboard, touch, and weapon-specific behavior.
- The top-level combat rail orders Menu, optional round status, Turn command console, battle roster, then the collapsed Arsenal drawer.
- The roster remains fully visible and accessible but sits after the current-turn decision surface.
- The existing fine-pointer Command Deck and coarse-pointer touch controls remain functionally unchanged.
- The consolidated console is visually stronger than the secondary roster/arsenal while preserving the current tactical theme.
- Desktop, Pixel landscape touch, and compact fine-pointer layouts remain fitted, unclipped, and free of battlefield obstruction.

## Boundaries

- Client HUD DOM/CSS and tests only.
- No engine, input mapping, turn rules, network action, Supabase, migration, auth, persistence, dependency, camera, renderer, or gameplay change.
- Do not remove health, weapon, wind, movement, Store, Arsenal, Menu, keyboard, or touch information.
- Do not add another overlay, modal, preference, tutorial gate, or phase-dependent auto-collapse behavior.

## Acceptance

1. Unit tests fail first unless the command console owns active row, instruments, progress, and actions in the required order and the roster follows the console at rail level.
2. Existing primary-action, instrument, command-input, arsenal, menu, mobility, and shell tests remain green.
3. Browser tests prove the decision sequence is geometrically ordered and fitted across all supported viewport projects.
4. Mutation checks prove moving instruments or roster back to the old hierarchy fails the new oracles.
5. The exact final package receives adversarial review with all Critical, High, and merge-blocking findings resolved before `$ca-commit` and `$ca-pr`.

# Opening Salvo Assist Specification

## Intent

Help a first-time player understand the relationship between elevation, power,
wind, and terrain before their first shot of a match, while preserving
ballistic judgment for every later turn.

## Player-visible contract

- During each seat's opening rotation of a match, the locally controlled human
  sees a static, in-world trajectory solution from the active barrel to the
  first collision point.
- The solution uses the real fixed-step launch, wind, gravity, swept collision,
  terrain, and living-tank geometry. It updates immediately when aim or power
  changes.
- The trajectory reads as a restrained gold targeting projection: sampled
  luminous pips along the arc, a landing bracket, and a compact
  `OPENING SOLUTION` label at the collision point.
- After the match's opening rotation (`state.turn >= state.tanks.length`), the existing
  short launch guide returns and the landing point is no longer revealed.
- The full solution appears only for direct-flight projectile weapons. Shield,
  airburst, and bouncing weapons retain the short launch guide rather than
  showing a misleading prediction of secondary behavior.
- The existing `G` preference enables or disables both forms of aim guidance.

## Determinism and ownership contract

- Prediction is a read-only presentation calculation. It never mutates
  `GameState`, advances the engine, emits an action, or enters the ordered room
  log.
- The current room gravity is threaded from game configuration; wind, terrain,
  tanks, angle, and power come from the authoritative state snapshot.
- `main.ts` retains the existing local-human ownership gate, so a networked
  player never receives an opponent's solution and CPU turns never display one.
- The trace is bounded by a named maximum tick count and sampled at a named
  interval. Non-finite inputs and out-of-bounds misses fail closed to no landing
  cue.

## Visual and layout bounds

- The assist is rendered inside the existing Canvas world pass. It adds no DOM
  panel, modal, scroll region, persistent animation, raster asset, or layout
  height.
- The existing ballistic computer, command legend, fire control, mobility
  rocker, and single-screen fit remain unchanged.
- The idle-skip optimization remains effective: the static solution redraws
  only when authoritative state or local input already marks the frame dirty.

## Out of scope

- Permanent aim assist, a purchasable tracer weapon, damage prediction, blast
  radius preview, secondary bomblet/bounce/napalm simulation, AI changes, or
  weapon tuning.
- Engine, replay, action-log, Edge Function, database, migration, authentication,
  RLS, Supabase deployment, dependency, or external asset changes.

## Acceptance

1. A pure test suite proves exact fixed-step sampling, swept ground/tank
   collision, room-gravity and wind effects, bounded miss behavior, and no
   mutation of the supplied state or tank.
2. Renderer tests prove the full opening solution is local-human and
   direct-flight only, falls back to the short guide after the match's opening rotation
   or for special weapons, respects the `G` preference, and draws after tanks.
3. A production-browser oracle proves the solution is visible before the
   opening shot, moves after an aim change, disappears after the match's opening
   rotation, and preserves single-screen geometry.
4. Real-browser inspection confirms the cue reads clearly without obscuring
   tanks, terrain, instruments, or the fire action.
5. Focused and full governed verification are green on a ready stacked PR; the
   PR is not merged and nothing is deployed.

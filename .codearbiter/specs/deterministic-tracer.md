# Spec: Deterministic tracer ranging shot

## Outcome

Give players a cheap, zero-damage ranging shot that follows the same deterministic
ballistics as a normal projectile, visibly marks its impact, consumes one tracer
round, and ends the active turn. It complements (rather than replaces) the existing
local launch guide: the guide is a partial prediction, while a tracer is an actual
network-replayed shot that reveals wind, collision, and wall behavior.

## Contract

- Add `tracer` as an implemented `WeaponType` with the reference catalog's low cost
  and bundle size, plus one deterministic starting round per tank.
- Selecting and firing `tracer` uses the existing `select_weapon` + `fire` contract;
  no new action kind, payload, database column, migration, or realtime channel.
- The normal `fire` action remains turn-ending and is logged with `weapon: "tracer"`.
- Tracer flight uses the existing launch velocity, fixed timestep, wind, wall, and
  terrain collision paths. It may visually bounce or otherwise follow the selected
  weapon's existing shared projectile path, but it deals zero tank damage and does
  not modify terrain or fire fields at impact.
- Impact produces a small cyan tracer marker/event so a player can read the landing
  point without confusing it with a damaging explosion. It must not award damage
  credits or alter terrain version/state; the ordinary turn stipend remains intact.
- Existing weapon selection, HUD ammo display/store, replay, and client renderer
  paths must remain backward-compatible for every other weapon.

## Boundaries

In scope: shared weapon definition/state, deterministic engine impact semantics,
replay compatibility through the existing fire row, client presentation, the
minimal `submit_action` weapon allowlist/test update needed to accept that row,
and tests.

Out of scope: auth, persistent profiles/progression, migrations, new dependencies,
AI strategy, new network action kinds, and changes to the existing launch-guide
prediction. No Supabase function behavior changes beyond the tracer allowlist.

## Acceptance tests

1. A tracer is selectable, starts with one round, decrements on fire, and rejects a
   second shot when empty without mutating the engine.
2. The same tracer fire action replayed through `replayNetworkAction` reaches the same
   terminal state as the live engine for the same seed and committed aim.
3. A tracer impact leaves terrain bytes, terrain version, tank health, credits, and
   fire fields unchanged while emitting the cyan marker event.
4. A normal weapon's damage, crater, credit, and replay behavior remains unchanged.
5. Client tests prove the tracer appears in the selection/store presentation and the
   marker is rendered through the existing fail-soft renderer path.
6. Full typecheck, deterministic harnesses, client tests, build, Edge tests, and
   hosted CI remain green.

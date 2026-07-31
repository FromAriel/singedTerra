# Sandhog Tunneling Weapon Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-30

## Problem

The weapon roster has strong blast, airburst, fire, terrain-raising, and
terrain-clearing identities, but every offensive shell still resolves at its
first surface contact. Terrain can protect a bunker indefinitely unless a
player first opens it from above. The postponed Sandhog is the highest-value
gameplay addition because it creates a new tactical question rather than
another damage tier: where should a shot enter the earth to attack from below?

## Goal

Add one complete **Sandhog** weapon that flies ballistically, converts a ground
impact into a visible fixed-step underground drill, carves a narrow tunnel, and
detonates at the drill endpoint. It must replay byte-identically in hot-seat and
network lockstep, fit the existing economy and weapon UI, and remain legible
without adding a landing prediction or full trajectory oracle.

## Authoritative behavior

- `sandhog` is a new implemented `WeaponType`, named **Sandhog**.
- Ballistic flight uses the unchanged shared projectile physics, wind, wall,
  muzzle, and swept-collision contracts.
- A direct tank hit detonates immediately at the swept tank contact. It does not
  pass through a tank to begin drilling.
- The first swept ground contact converts the same projectile into a burrowing
  projectile instead of detonating.
- Burrowing uses fixed deterministic state carried by `ProjectileState`:
  `burrowTicksRemaining` is present only while the drill is underground.
- The drill direction is fixed at ground entry:
  horizontal sign follows the impact projectile velocity (`vx < 0` drills left,
  otherwise right), horizontal speed is `3.2` px/tick, and downward speed is
  `2.4` px/tick.
- The drill runs for `22` ticks, producing an approximately `88`-pixel
  five-four-three diagonal path. It does not read wall-clock time, RNG, input,
  client state, or a target position after launch.
- Each underground tick clears a disc of radius `7` from the authoritative
  terrain bitmap. Deformed ranges feed the existing settle/terrain-version
  contract; tank drops, burial, and collapse remain emergent from current
  engine rules.
- The drill ignores terrain collision while burrowing. It continues its fixed
  path through solids or an existing cavity.
- Reaching the fixed tick budget detonates at the current in-bounds drill
  position. Reaching a battlefield boundary first detonates at the last
  in-bounds position; it never writes outside the terrain bitmap.
- The endpoint blast has radius `38`, peak damage `70`, blast reach/falloff
  unchanged, and damage may reach a tank through intervening terrain. That
  beneath-cover threat is the weapon's intended counterplay.
- A game-ending Sandhog, multi-round transition, clone, replay, and network
  action log follow the existing turn-resolution contracts without a new
  action type or serialized `GameState`.

## Economy and selection

- Canonical catalog values are used: price `$16,750`, bundle size `5`, arms
  level `0`.
- A fresh tank starts with one Sandhog so the new mechanic is immediately
  playable; later rounds carry remaining/purchased ammo like every weapon.
- Store purchase, ammo spend, unavailable/zero-ammo rejection, Fire labeling,
  Arsenal selection, room arms gating, and scoreboard credit attribution reuse
  the existing weapon paths.
- Existing AI behavior may treat Sandhog as an owned heavy option, but a new
  terrain-analysis personality or target-selection model is outside this slice.

## Visual and audio contract

- Sandhog has a distinct drill/projectile glyph in Arsenal, Store, the command
  console, and live flight; it must not reuse the generic earth-box language.
- Above ground it reads as a compact drill-shaped payload with a warm
  brass/ember signature.
- While `burrowTicksRemaining` is present, the payload orientation follows its
  fixed underground vector and the renderer adds a bounded drill head, short
  spark/dirt wake, and visible carved corridor. Presentation state is
  render-only and cannot affect replay.
- The drill remains visible inside the corridor it clears; it must not vanish
  behind an opaque terrain repaint.
- Reduced-motion suppresses decorative wake/particle motion while retaining the
  drill head, terrain deformation, and endpoint blast.
- Existing launch and impact audio remain valid. A new audio file, paid asset,
  dependency, or platform API is not required.
- The bounded aim guide remains an orientation/power cue only. It does not show
  surface contact, the underground path, or the endpoint.

## Verification

- RED/GREEN deterministic harnesses prove the ballistic-to-burrow transition,
  exact 22-tick fixed path, per-tick tunnel radius, endpoint blast, boundary
  safety, direct-tank exception, damage-through-cover, clone/replay parity,
  turn completion, and same-seed byte identity.
- Unit tests pin the complete weapon definition, default inventory, icon,
  projectile profile, burrowing silhouette/wake, and exhaustive mappings.
- Edge tests prove `submit_action` accepts exact `sandhog` fire/buy payloads and
  rejects unknown weapon strings; no migration or backend deployment is needed
  beyond the existing function allowlist update.
- Browser acceptance selects Sandhog through the real Arsenal, observes the
  synchronized command-console icon/name/Fire label, fires it, and proves live
  terrain pixels change along a diagonal underground corridor before the
  endpoint blast resolves.
- Full deterministic checks, client coverage, Edge tests, build, E2E, runtime
  audit, diff hygiene, secret scan, adversarial review, exact hosted CI/CodeQL,
  Pages deployment provenance, and public play pass before delivery.

## Out of scope

- Baby/Heavy Sandhog variants, steering/guidance, homing, target selection,
  mid-flight player input, trajectory prediction, new wall modes, or balance
  changes to existing weapons.
- A new database column, migration, Realtime action, Edge Function, dependency,
  paid asset, raster atlas, or server-authoritative physics.
- Parachutes, fall damage, teams, room browser work, or unrelated HUD changes.

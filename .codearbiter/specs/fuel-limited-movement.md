# Fuel-Limited Movement Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-28

## Problem

singedTerra already exposes fuel in its serializable tank state and promises
fuel-limited movement in the project specification, but every tank still opens
with zero fuel and remains fixed for the entire round. This removes a defining
artillery-game decision: spend a scarce resource to improve the shot, escape a
bad position, or preserve mobility for later.

## Goal

Add deterministic, terrain-aware tank movement as a meaningful turn-neutral
choice in hot-seat and networked play, with clear single-screen controls,
authoritative fuel feedback, and the canonical Fuel Tank store item.

## Player-facing contract

- Every fresh round gives each tank 100 movement fuel.
- During its `PLAYER_TURN`, a living, unburied tank may move left or right in
  discrete steps using `A` / `D` or the visible mobility rocker.
- One activation requests at most eight logical horizontal pixels. Movement
  resolves one pixel at a time and spends one fuel only for each pixel actually
  traveled.
- Movement stops cleanly at the battlefield edge, an impassable terrain step,
  another living tank, or exhausted fuel. It never consumes fuel for rejected
  distance.
- Moving is turn-neutral: it does not fire, change wind, advance the turn,
  alter aim, or select a weapon.
- The active-turn row shows authoritative remaining fuel and left/right
  controls without adding a page, modal, scroll region, or continuously
  animated element.
- Keyboard auto-repeat is ignored for movement. Each physical `A` / `D` press
  emits one bounded action; aim and power arrows retain their existing repeat
  behavior.
- The store offers the Scorched Earth catalog's arms-level-3 Fuel Tank for
  $10,000. One purchase grants 100 fuel; purchases may stack and remain
  turn-neutral.
- Fuel resets to 100 with health and shields at each fresh round. Purchased
  fuel affects the current staged/active round and does not become a
  match-persistent inventory item.

## Deterministic engine contract

- `PlayerAction` and the canonical `NetworkAction` log gain
  `{ type: 'move', delta: integer }`.
- A valid `delta` is a non-zero integer in `[-8, 8]`. The engine and the
  Supabase referee enforce the same bounds.
- The active tank is sampled against the existing terrain bitmap one integer
  column at a time. A step is passable only when its surface-height change is
  no greater than four logical pixels and the candidate tank footprint does
  not overlap another living, unburied tank.
- Position and fuel mutation are pure functions of current game state and the
  logged delta. Movement reads no clock, random source, viewport, DOM, or
  client-only state.
- Replaying the same seed and ordered action log produces identical tank
  positions and fuel in every client.

## Network and security contract

- A move is a committed, turn-neutral action. `NetworkClient` submits it to
  `submit_action` and applies it only from the ordered Realtime echo.
- `submit_action` validates the exact integer bounds before a move can enter
  `room_actions`.
- Move authorization retains the existing seat-token, room-membership,
  active-turn ownership, bot-proxy, atomic sequence-allocation, and rate-limit
  controls. It receives no ROUND_OVER relaxation and never advances the
  referee cursor.
- No client secret, service-role credential, migration, new table, or
  authoritative server-side physics is introduced.

## Store contract

- `AccessoryType` gains `fuel_tank`.
- Its canonical constants are price `$10,000`, bundle size `10`, ten fuel units
  per tank, 100 fuel per purchase, and arms level `3`.
- Hot-seat and networked purchases use the existing `buy.accessory` path. The
  engine independently revalidates affordability and arms level so both
  execution contexts remain aligned.

## Verification

- A deterministic RED/GREEN harness pins valid traversal, partial movement,
  fuel accounting, steep-terrain rejection, battlefield bounds, tank
  collision, phase/burial/death gates, round reset, and Fuel Tank purchasing.
- Replay tests prove move ordering and state parity across two engines.
- Input tests pin `A` / `D`, case handling, `preventDefault`, focused-control
  suppression, and repeat suppression.
- HUD and browser oracles prove semantic controls, authoritative fuel updates,
  disabled states, full-stage fit, and zero scrolling on desktop, compact
  touch, and small-window viewports.
- Deno unit/live-handler tests prove shape rejection, active-seat
  authorization, turn neutrality, and exact committed payloads.
- The full deterministic, client, coverage, Edge, build, E2E, audit, diff, and
  secret gates pass before delivery.

## Out of scope

- CPU movement planning, pathfinding, falling/fall damage, jumping, teleporting,
  destructible vehicles, or animation between logged integer positions.
- Continuous held-key movement, analog acceleration, client prediction, or
  physics-frequency network actions.
- Changes to projectile physics, terrain deformation, match identity, database
  schema, deployment, merge, or the default branch.
- A third-party dependency: dependencies remain allowed, but the existing
  engine, action-log, DOM, and CSS primitives fully cover this bounded slice.

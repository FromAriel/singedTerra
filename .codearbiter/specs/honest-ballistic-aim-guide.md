# Honest Ballistic Aim Guide Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-30

## Problem

The current aim guide is a straight muzzle ray. It is coaxial with the authored
barrel, but it reads as a laser and withholds the most useful aiming information:
how gravity and wind begin to bend this particular shot. An earlier decorative
curve was worse because it left the barrel and then changed direction without
following the game physics.

## Goal

Replace the straight laser with a short, honest ballistic hint. It must leave the
muzzle tangentially, follow the same initial velocity, wind, effective gravity,
terrain, tank, and wall contracts as a real shot, and fade within approximately
the current guide reach. It is a ranging aid, not a full landing predictor.

## Authoritative presentation contract

- The first point is the exact shared `barrelTip(tank, BARREL_LENGTH)`.
- A short zero-time interpolation sample follows the unaccelerated launch
  velocity, so the visible path is tangent to the authored barrel at the muzzle.
- Subsequent whole-tick samples use the shared `launchVelocity()` and
  `stepProjectile()` recurrence with the current state wind and the Renderer
  effective gravity. No decorative bend, Bézier-only approximation, RNG, or
  wall-clock input may alter the path.
- The hint simulates at most the existing fourteen-tick preview horizon.
- Arc length remains capped by the existing bounded reach formula:
  `48 + sqrt(clamp(power / 100, 0, 1)) * 78` logical pixels. If the next real
  segment crosses that cap, the visible endpoint is interpolated on that segment.
- Swept collision uses the current terrain, living tanks, and wall mode. A first
  ground, tank, wall, or open-boundary contact inside the short horizon ends the
  hint at that contact. This may accurately reveal an inherently very short shot,
  which the user explicitly accepts; the guide never continues into a bounce,
  bank, drill, split, fire field, blast, or damage prediction.
- No endpoint marker, target label, range number, blast radius, or impact damage
  is shown.

## Visual contract

- The guide is a thin, warm, segmented ballistic curve rather than one
  constant-alpha solid laser.
- Both segment and bead opacity decrease monotonically with traveled arc length;
  the final visible sample fades to near-transparent.
- The opening remains visibly connected to right- and left-facing authored
  barrels without a gap or kink.
- The existing local-player ownership policy, `G` toggle, persisted preference,
  phase gate, single-page layout, and reduced-motion behavior remain unchanged.

## Acceptance

- Unit tests compare every whole-tick preview sample to the shared physics
  recurrence under positive, negative, and calm wind plus normal and
  sudden-death gravity.
- Unit tests prove exact muzzle origin, tangent opening, legacy reach cap,
  fourteen-tick ceiling, and first-contact truncation for terrain, tanks, open
  bounds, and reflective walls.
- Stateful Canvas tests prove segment opacity fades monotonically and no impact
  marker is drawn.
- Production-browser acceptance proves both right- and left-facing guides leave
  the authored barrel, visibly curve in the correct gravity direction, react to
  wind/aim/power, stay bounded, and preserve the fitted single-page game.

## Boundaries

- No engine, replay, action-log, Supabase, schema, economy, weapon, AI, damage,
  terrain, or collision behavior changes.
- No full-flight oracle, future-turn wind forecast, bounce/bank continuation, or
  weapon-specific post-impact prediction.
- No dependency, migration, paid asset, or backend deployment.

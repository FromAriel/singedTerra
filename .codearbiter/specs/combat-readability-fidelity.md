# Combat Readability Fidelity Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-30

## Problem

The Garage exposes four independently selectable tank parts, but the three
authored families currently retain nearly the same tracked silhouette at
battlefield scale. Players can make a choice without being able to read that
choice during play. The short launch guide also begins at the shared muzzle but
curves away immediately, so it does not look coaxial with the barrel. In the
right rail, the active-turn strip gives a full-width row to several competing
items, truncating the active player's name and flattening the information
hierarchy.

## Goal

Make the player's battlefield choices and current combat state legible at a
glance: unmistakably different propulsion silhouettes, a launch cue that leaves
the visible muzzle in a straight line, and a compact active-turn module that
shows the full player identity before secondary weapon, fuel, and movement data.

## Tank silhouette contract

- The three existing cosmetic families remain free and independently mixable;
  no saved-room or network payload shape changes.
- Their propulsion parts become distinct vehicle classes:
  - **Foundry Tracks:** a heavy continuous tread belt with visible road wheels.
  - **Ranger Walker:** articulated spider/mech legs, with no wheels or tread
    belt.
  - **Bulwark Hover:** a broad antigravity skirt with lift pods/underglow, with
    no wheels, tracks, or legs.
- Matching hulls and turrets reinforce each class: industrial armor, a
  high-clearance scout body, and a wide floating siege body respectively.
- Every part remains readable after the atlas is downscaled to the live
  36-by-24 logical-pixel chassis envelope.
- Mixed loadouts continue to use the same pivot, ground anchor, player tint,
  authored-alpha restoration, and deterministic hitbox as before.
- The Garage names the propulsion choice by what it visibly is, rather than
  showing only the family name.
- Tank loadouts remain presentation-only. Physics, collision, fuel cost,
  movement rules, terrain contact, action logs, and replay outcomes do not vary
  by cosmetic family.

## Muzzle and launch-guide contract

- Barrel art, projectile spawn, muzzle flash, AI forward simulation, and the
  launch guide continue to use the shared `barrelTip()` contract.
- The first point of the guide is the exact muzzle.
- The opening guide segment is tangent to the barrel aim vector. At least the
  first four sampled points are collinear with the barrel within floating-point
  tolerance.
- Any decorative lift begins only after that straight opening run and remains a
  short non-authoritative launch cue. It still must not reveal terrain
  collision, wind compensation, wall bounces, or the landing point.
- The visible guide must remain connected to the rendered authored barrel for
  all three barrel families at representative left-, vertical-, and
  right-facing angles.

## Active-turn module contract

- The active player's full name receives its own primary row and does not
  ellipsize for the allowed 20-character player-name limit at the standard
  desktop rail width.
- A second tactical row groups the selected weapon with fuel and symmetric
  left/right movement controls.
- Player identity has the highest typographic contrast, weapon is secondary,
  and fuel/movement are compact controls rather than equal competing columns.
- Movement retains semantic buttons, keyboard hints, disabled state, focus
  treatment, authoritative fuel, and the existing `A`/`D` behavior.
- The module remains a single fitted HUD component with no page scroll, panel
  overflow, horizontal clipping, or overlap on desktop, compact touch, and the
  small-window regression viewport.
- The existing accessible turn-status announcement remains atomic and includes
  player, weapon, and remaining fuel.

## Verification

- RED/GREEN unit tests pin exact muzzle origin, opening-segment collinearity,
  delayed decorative lift, and left/right angle symmetry.
- Atlas tests pin dimensions, alpha, occupied cells, shared barrel mount
  occupancy, and materially distinct propulsion silhouettes.
- Renderer and Garage tests prove all three propulsion families and mixed
  loadouts draw through the authored path without changing simulation state.
- HUD tests prove the new hierarchy, complete player name, semantic controls,
  and authoritative updates.
- Browser tests exercise the live gameplay viewport at desktop, compact touch,
  and small-window sizes, with pixel and bounding-box oracles for silhouette
  distinction, muzzle/guide continuity, full player identity, and zero scroll.
- The full deterministic, client, coverage, Edge, build, E2E, audit, diff, and
  secret gates pass before delivery.

## Out of scope

- Different movement stats, leg gait simulation, hover physics, collision
  boxes, terrain permissions, sound sets, animation rigs, or gameplay bonuses
  by chassis.
- New loadout fields, persistence changes, migrations, Edge Function changes,
  dependencies, or paid assets.
- A full trajectory preview or landing-point indicator.


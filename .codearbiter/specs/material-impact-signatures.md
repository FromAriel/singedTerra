# Material Impact Signatures

**Status:** Approved under the standing passion-project sprint authority
**Date:** 2026-07-28
**Branch:** `codex/material-impact-signatures`

## Problem

The battlefield now has strong projectile, blast, lighting, recoil, and terrain
effects, but a shell that directly strikes armor still begins with the same
terrain-debris and boom treatment as a ground impact. The most rewarding shot
therefore lacks a distinct first-frame payoff, while a miss near a tank can feel
nearly identical to a direct hit.

## Goal

Make ground and direct-armor impacts immediately distinguishable by sight and
sound without changing damage, collision, physics, replay actions, or network
state.

## Player contract

- A collision with terrain keeps the existing dirt ejecta and gains a compact
  low material thud under the weapon explosion.
- A direct collision with a tank suppresses dirt ejecta at the collision point,
  adds a bounded metal-fragment and white-hot spark signature, shows a compact
  `DIRECT HIT` readout, and adds a short metallic transient under the explosion.
- Reduced-motion mode keeps the informational `DIRECT HIT` readout but suppresses
  the added moving fragments and sparks.
- Multi-warhead impacts still produce every visual event, but audio is coalesced
  to one material transient per rendered batch. Armor takes priority when the
  batch contains both armor and ground impacts.
- Existing and synthetic explosion events without material provenance retain
  the current presentation and do not invent a material sound.

## Technical contract

- Add an optional `impactType: 'ground' | 'tank'` field to `ExplosionEvent`.
  It is derived from the authoritative swept-collision result.
- Direct tank and ground projectile paths, including napalm ignition and
  bouncing-mine contact blasts, carry the field. Flight-cap/air detonations omit
  it.
- The field is additive and deterministic. It does not cross the action log or
  Supabase request contract; every client derives it while replaying the same
  action through the same engine.
- Renderer material routing is bounded, fail-closed, and independent from weapon
  explosion profiles. Weapon color/radius/style continue to own the main burst.
- Audio remains procedural Web Audio. Canvas and Web Audio already provide the
  required primitives, so no third-party dependency is added.

## Acceptance

- Engine regression coverage proves actual swept tank and ground collision paths
  emit the correct material and that air detonation omits it.
- Renderer coverage proves armor replaces dirt ejecta, preserves the reduced-
  motion readout, and coalesces audio with armor priority.
- Audio profile coverage proves finite, bounded terrain and armor signatures.
- Existing deterministic, client, Edge, build, and rendering suites remain green.
- No canonical damage, terrain, turn, replay-action, migration, or Supabase
  behavior changes.

## Out of scope

- New damage bonuses for direct hits.
- Per-tank armor classes or ricochet physics.
- Sampled audio files, asset downloads, or new dependencies.
- Reworking the weapon-specific explosion or shield-impact systems.

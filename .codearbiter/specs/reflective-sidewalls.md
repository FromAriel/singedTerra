# Reflective Sidewalls

**Status:** Approved under the standing passion-project sprint authority
**Date:** 2026-07-28
**Branch:** `codex/reflective-sidewalls`

## Problem

The core duel has a broad weapon set and strong impact feedback, but every shot
still treats both horizontal boundaries as a flat miss. That removes a signature
artillery-game tactic: using the battlefield edge to reach around terrain or
attack from an unexpected direction.

## Goal

Add an opt-in reflective sidewall room mode that creates readable, deterministic
bank shots in hot-seat and networked play.

## Player contract

- Room setup offers `Open` and `Reflective` sidewalls; `Open` remains the default.
- In reflective mode, crossing the left or right battlefield edge reflects only
  horizontal projectile velocity and continues the same shot.
- Gravity, wind, projectile age, weapon behavior, and vertical motion continue
  uninterrupted. The top stays open and terrain/bottom collisions are unchanged.
- Two static energy rails make the active wall rule unmistakable without idle
  animation or layout changes.
- Every authoritative wall contact produces a bounded rail flash and a short
  procedural ricochet cue. Reduced motion suppresses moving decoration but keeps
  the static rails.
- CPU shot search uses the same wall rule as live execution. Player aim guidance
  remains a short stylized launch vector that intentionally ignores authoritative
  ballistics: it never reveals an impact point or solves a bank shot.
- Fresh tanks point 45 degrees toward their nearest opponent (135 degrees when
  that opponent is left), including new rounds; deterministic roster order breaks
  equal-distance ties.

## Technical contract

- Add `WallMode = 'open' | 'reflective'` and optional `GameOptions.walls`.
- Surface the normalized mode in `GameState.walls` so renderer and AI consume the
  same immutable room rule. Missing/invalid values normalize to `open`.
- Swept collision returns an exact sidewall contact in reflective mode. A shared
  pure reflection helper snaps the projectile just inside the boundary and flips
  horizontal velocity away from that wall.
- Wall contacts do not explode, deform terrain, deal damage, reset projectile age,
  or end the turn. The existing flight cap remains the bounded safety valve.
- Live execution and AI probing share that flight cap and score the same forced
  detonation point.
- Record bounded monotonic wall-contact events for renderer/audio edge detection.
- Persist and validate the option in the existing room-options JSON. No database
  migration or new action-log field is required.
- All clients derive wall contacts by replaying the same action through the same
  shared engine. No wall state is submitted by a client.

## Acceptance

- Engine harnesses prove exact left/right reflection, default-open misses,
  multi-bounce determinism, flight-cap resolution, and clone/replay parity.
- AI coverage proves banked trajectories use the room mode. Aim-guide coverage
  proves opening and later turns expose only a bounded non-authoritative vector.
- Renderer/effects/audio coverage proves static rails, bounded contact feedback,
  dedupe, and reduced-motion behavior.
- Lobby/transport/Edge coverage proves hot-seat and network room-option plumbing,
  including invalid-value normalization.
- Existing deterministic, client, Edge, build, and browser suites remain green.

## Out of scope

- Wrap/teleport, concrete, ceiling, or destructible-wall modes.
- Wall damage, wall health, or wall purchases.
- Changing terrain collision, tank movement boundaries, or blast geometry.
- New dependencies, sampled audio, migrations, merge, or deployment.

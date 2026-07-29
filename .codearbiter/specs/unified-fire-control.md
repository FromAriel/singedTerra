# Unified Fire Control Specification

## Intent

Make the game’s primary turn action obvious and clickable without requiring a
new player to discover the keyboard legend or use a touch-only control.

## Player-visible contract

- The combat rail presents one prominent primary action at every pointer type.
- Projectile weapons label the action `Fire`; selecting Shield changes it to
  `Activate shield`.
- The action is enabled only while the local human owns an actionable
  `PLAYER_TURN`.
- It is visibly and semantically disabled while a shot is being submitted or
  resolved, during another network player’s turn, during a CPU turn, while
  paused, or when no active tank exists.
- Pointer, keyboard, and assistive-technology activation use the same button and
  emit exactly one action.
- Touch keeps its angle, power, and weapon steppers without rendering a second
  competing Fire action.

## Technical contract

- The HUD owns presentation state but receives an explicit local-control signal
  from the existing ownership calculation in `main.ts`.
- The button delegates to `InputHandler.triggerFire()`, preserving the existing
  `fire` versus `use_shield` action mapping and all engine/client validation.
- The callback path retains the same paused/CPU input gate as keyboard and touch
  controls; visual disabled state is not treated as an authority boundary.
- No engine, physics, replay, action-log, network, database, Supabase, or
  deterministic behavior changes.

## Layout contract

- The action uses the combat shell’s existing semantic tokens and occupies a
  fixed, bounded rail row.
- The fitted stage remains single-screen with no document or HUD scrolling at
  supported desktop, compact-touch, and small-window viewports.
- Focus indication, disabled contrast, and a minimum 44px coarse-pointer target
  remain explicit.

## Acceptance

1. Unit tests pin one shared primary action, state-aware labels, exactly-once
   activation, and disabled ownership/phase behavior.
2. Main wiring tests or a factored pure ownership contract prove local-network,
   opponent-network, human-hot-seat, CPU, and paused outcomes.
3. Production-browser tests prove the action is visible and in-bounds at every
   viewport, fires through the live input path, and does not duplicate on touch.
4. Focused and full governed verification are green on a ready stacked PR; the
   PR is not merged and nothing is deployed.

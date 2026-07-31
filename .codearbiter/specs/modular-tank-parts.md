# Modular Tank Parts Specification

## Goal

Replace the visual-quality mismatch between the authored chassis and procedural
barrel with one coherent, modular tank assembly whose aim guide begins at the
visible muzzle.

## Contract

- Every living tank is assembled from independently addressable authored
  `treads`, `hull`, `turret`, and `barrel` slots.
- A named default part set preserves the current collision footprint, tank
  surface contact, player-color identity, active glow, damage overlay, recoil,
  burial, and wreck behavior.
- The barrel rotates around the shared engine pivot and its visible muzzle is
  exactly `BARREL_LENGTH` from that pivot.
- The bounded aim guide begins at that same shared muzzle point and remains a
  launch-direction hint, never a complete trajectory or impact prediction.
- Loading, decode, atlas-layout, or draw failures fail closed to the existing
  chassis and procedural barrel.

## Customization seam

- Slot identity and source rectangles are data, not renderer conditionals.
- A future player cosmetic selection can mix compatible slot definitions
  without changing physics, hitboxes, turn actions, or deterministic replay.
- This slice ships one complete default set and the slot contract; it does not
  add economy, unlocks, persistence, or network payloads.

## Constraints

- Client presentation only; no engine constants, collision, weapon tuning,
  Supabase, migration, action-log, input, or dependency change.
- One base-aware 1024x128 transparent WebP atlas, bounded to 150 kB.
- Canvas 2D remains the renderer; all parts stay legible at gameplay scale.

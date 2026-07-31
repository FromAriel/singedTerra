# Touch Utility Controls

## Status

Approved as SUaDtL under the standing passion-project sprint authority.

## Problem

The coarse-pointer command dock now makes combat input playable, but two
remaining utility controls still violate the same mobile interaction contract:
Menu and Arsenal render only about 27.5 pixels tall at 915-by-412. The dock's
9-pixel authored labels also resolve to roughly 5.6 rendered pixels at that
supported phone scale, leaving the new controls functionally large but visually
weak.

## Player outcome

Finish the mobile input surface so every visible control is thumb-sized and the
most-used commands are immediately legible without zooming or hunting through
the narrow tactical rail.

## Acceptance contract

- The coarse-pointer dock exposes eight stable controls in one fitted row:
  aim left/right, power down/up, move left/right, weapon cycle, and Menu.
- The Menu control opens the existing non-destructive pause surface; Resume
  returns to the live game without changing the rail's fine-pointer behavior.
- At 915-by-412 every visible button is at least 44 rendered pixels tall and
  wide. The hidden rail Menu does not remain as a duplicate touch target.
- The Arsenal expand/collapse control remains in the tactical rail and renders
  at least 44-by-44 pixels on coarse pointers.
- Weapon receives a wider dock cell so its live identity remains readable.
  Dock labels render at least 8 pixels high and authored command symbols at
  least 18-by-18 rendered pixels at 915-by-412.
- Opening Arsenal still hides and inerts the dock; closing restores all eight
  controls. Store and Fire remain fitted, visible, and at least 44-by-44.
- Desktop-fine retains its current Menu, keyboard deck, rail rocker, and Arsenal
  geometry unchanged.
- Desktop-fine, pixel-touch, and small-window layouts remain contained and
  page-scroll-free.

## Boundaries

- No pause semantics, movement, aim, power, weapon, economy, deterministic
  engine, action-log, keyboard, replay, Supabase, or backend change.
- No dependency, migration, paid asset, Canvas renderer, or deployment-service
  change.

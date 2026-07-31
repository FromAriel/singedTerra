# Touch Mobility Dock

## Status

Approved as SUaDtL under the standing passion-project sprint authority.

## Problem

The new touch command dock makes aim, power, and weapon selection usable, but
tank movement remains trapped in the scaled tactical rail. At the supported
915-by-412 viewport each movement button is only about 16.9 rendered pixels
wide, well below the 44-pixel touch floor and much weaker than every other
mobile combat command.

## Player outcome

Make movement a first-class touch command beside aim, power, and weapon
selection, while turning the narrow rail mobility block into a clear fuel
status rather than a pair of unusable duplicate controls.

## Acceptance contract

- The coarse-pointer dock exposes seven stable commands in one fitted row:
  aim left/right, power down/up, move left/right, and weapon cycle.
- Move left emits the existing `-8` movement step and move right emits `+8`.
  A live browser action spends authoritative fuel without ending the turn.
- Every dock target remains at least 44 rendered pixels tall and wide at
  915-by-412, with explicit accessible names and `data-command` identities.
- Touch movement follows the same alive, unburied, local-turn, non-firing, and
  positive-fuel disable gate as the existing rail rocker.
- Coarse-pointer layouts hide the redundant narrow rail movement buttons and
  retain a centered, readable fuel dial. Store and Fire remain visible,
  distinct, and at least 44 rendered pixels in both dimensions.
- Opening Arsenal hides and inerts the entire dock; closing restores all seven
  commands and their current enabled state.
- Fine-pointer layouts keep the existing keyboard deck and rail rocker
  unchanged.
- Desktop-fine, pixel-touch, and small-window layouts remain contained and
  page-scroll-free.

## Boundaries

- No movement distance, fuel cost, economy, deterministic engine, action log,
  keyboard mapping, replay, Supabase, or backend change.
- No dependency, migration, paid asset, Canvas renderer, or deployment-service
  change.

# Turn Handoff Beacon Specification

## Intent

Make turn ownership unmistakable at a glance, especially in hot-seat and
first-time play, without adding another panel or increasing the fitted combat
rail's height.

## Player-visible contract

- The compact row below the ballistic computer names the active player as the
  primary signal and the selected weapon as secondary context.
- The owner signal uses the active tank's team color plus the existing
  gold/ember current-state vocabulary.
- Human and CPU labels reuse the canonical HUD player label, so a CPU seat
  remains visibly identified.
- A turn change retriggers one short, event-driven emphasis on the owner row and
  active roster entry. No idle or per-frame decorative animation is introduced.
- Firing keeps the existing in-flight state but names the player whose shot is
  resolving.
- Missing or terminal active-seat state clears the owner signal rather than
  showing stale identity.

## Accessibility contract

- The owner row is a polite atomic status region with a complete accessible
  sentence naming the player and selected weapon.
- Color is reinforcement only; visible text remains the identity source.
- Reduced-motion users receive the same text and color state without the
  handoff animation.

## Bounds

- No engine, physics, weapon tuning, input, replay, action-log, network,
  database, Edge Function, migration, authentication, or Supabase change.
- No dependency or asset addition.
- The existing 1464 by 600 logical stage remains authoritative.
- The rail and document remain non-scrolling in supported desktop, compact
  touch, and small-window layouts.

## Acceptance

1. Unit tests pin initial owner/weapon output, human-to-human and human-to-CPU
   handoffs, firing copy, accessible status, and stale-state clearing.
2. Browser tests prove the active player name is visibly present and the rail
   remains fitted in supported viewport projects.
3. Real-browser inspection confirms the owner is more prominent than the
   weapon while the ballistic computer and battlefield retain hierarchy.
4. Focused and full governed verification are green on a stacked ready PR; the
   PR is not merged and nothing is deployed.

# Single-Screen Combat Shell Specification

## Intent

Turn the right-side HUD from a stack of separately decorated widgets into one
coherent artillery control rail that feels authored as a system and remains
fully playable in a single viewport.

## Design read

- The game itself already has a distinctive battlefield and a strong
  fire-control console, but the surrounding HUD repeats borders, glows,
  radii, and heading treatments without a shared hierarchy.
- Six independently boxed sections make the rail feel like assembled widgets
  rather than one machine.
- Expanding the arsenal currently participates in document flow, so a useful
  control can make the fitted game panel scroll.
- The intended visual language is a dense retro-futurist field instrument:
  compact, precise, tactile, and readable rather than ornamental.

## Player-visible contract

- The entire right side reads as one continuous combat rail with a shared
  surface, edge, spacing, typography, and state vocabulary.
- Menu, roster, ballistic computer, active weapon, store, and arsenal use
  section rhythm and separators instead of six competing outer boxes.
- Ember and gold indicate current or actionable state; team colors remain a
  functional identity exception.
- The arsenal opens as an opaque drawer inside the rail's bounds. Opening it
  never changes the rail's `scrollHeight`, moves the battlefield, or requires
  an inner scrollbar.
- The drawer has a clear title, close action, weapon count, selected state,
  and keyboard-visible focus. Its existing weapon selection behavior and
  persisted preference remain authoritative.
- A small, consistent icon vocabulary reinforces familiar actions while
  visible text remains the source of accessible names.
- The ballistic computer remains the visual anchor, with its corrected aim
  direction and matched elevation/power scale preserved.

## Design-system contract

- Semantic CSS tokens cover the combat shell's surfaces, separators, type
  roles, spacing, radii, focus, muted text, and action states.
- Reusable section and action classes consume semantic tokens; components do
  not introduce arbitrary one-off border/glow/radius combinations.
- Lucide may supply exact named SVG icons only after its dependency review
  clears. Imports must remain tree-shakeable; no full icon registry is shipped.
- Decorative icon nodes are hidden from assistive technology. Buttons retain
  visible text and explicit accessible names.
- The system and its exceptions are documented for the next player-facing
  slice so future polish compounds rather than fragments.

## Bounds and compatibility

- No physics, input semantics, weapons, replay, action-log, network, database,
  Edge Function, migration, authentication, or Supabase contract changes.
- The HUD remains HTML/SVG overlaid beside the Canvas battlefield.
- The existing 1464 by 600 logical stage and its current responsive scaling
  remain the layout authority for this slice.
- No continuous animation or new idle rendering loop is introduced.
- The dependency is pinned through the repository lockfile and must not add
  install lifecycle scripts or a runtime transitive dependency chain.

## Acceptance

1. Unit tests pin the shared shell/section contract, drawer semantics, icon
   accessibility, existing selection behavior, and persisted preference.
2. Browser tests prove collapsed and expanded states keep
   `scrollHeight <= clientHeight` in desktop, small-window, and compact-touch
   projects while the drawer remains fully visible and operable.
3. A production build records the icon dependency's exact bundle impact
   against the 222.76 kB / 60.26 kB gzip parent baseline.
4. Real-browser comparison confirms one coherent rail, a conspicuous hierarchy
   improvement, intact battlefield prominence, and no inner page or HUD scroll.
5. Focused and full governed verification are green on a stacked ready PR;
   the PR is not merged and nothing is deployed.

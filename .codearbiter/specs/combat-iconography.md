# Combat Iconography Specification

## Goal

Make the combat rail's symbols read as part of singedTerra's artillery command
console, with unmistakable meanings at gameplay scale.

## Player-facing contract

- Arsenal uses an ordnance/bomb symbol, never package or cardboard-box imagery.
- Store uses a credits/coins symbol rather than a generic shopping container.
- Menu, Store, Fire, and Arsenal use one compact framed-glyph treatment.
- Fire keeps its targeting-reticle meaning; Menu keeps the conventional menu
  meaning; disclosure remains an unframed directional chevron.
- Visible labels remain present, so icons reinforce rather than replace text.
- The treatment remains legible at the fitted desktop, touch-landscape, and
  small-window scales without changing rail height, drawer behavior, or page
  overflow.

## Architecture and constraints

- Extend the existing explicit, tree-shaken `hudIcons.ts` seam.
- Reuse the exact-pinned, already-vetted Lucide dependency; add no dependency,
  asset download, runtime catalog, or lockfile change.
- Expose stable semantic metadata (`menu`, `credits`, `target`, `ordnance`,
  `disclosure`) for tests and future design-system consumers.
- Use semantic combat-UI tokens and a single reusable glyph wrapper.
- Presentation only: no engine, input, action-log, Supabase, layout geometry,
  or deterministic-state change.

## Acceptance

- Unit tests pin the semantic mapping, bomb/coin SVG geometry, framed set, and
  decorative accessibility.
- The production browser shows the new Arsenal and Store marks and preserves
  all labels, controls, drawer behavior, focus behavior, and no-scroll fit.
- Existing deterministic, client, Edge, build, browser, audit, and review gates
  remain green.

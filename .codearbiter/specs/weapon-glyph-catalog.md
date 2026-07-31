# Weapon Glyph Catalog Specification

## Goal

Make weapons visually scannable in the Arsenal and Store instead of presenting
every munition as the same text rectangle.

## Contract

- Every `WeaponType` has an explicit, exhaustive glyph assignment.
- Related weapons share a readable family silhouette: rockets, nuclear,
  terrain, bounce, volatile, fire, airburst, MIRV, death, and defense.
- Each glyph exposes stable weapon and family metadata, remains decorative, and
  sits beside the complete visible weapon name.
- Arsenal buttons and Store rows reuse the same factory; ammunition, ownership,
  price, selection, disabled state, and all click behavior remain unchanged.
- The fitted rail and Store remain legible and free of overflow at desktop,
  touch landscape, and small-window scales.

## Constraints

- Reuse exact-pinned Lucide with explicit imports; no new dependency, asset
  load, catalog-wide import, or lockfile change.
- Client presentation only; no engine, weapon definition, input, action-log,
  Supabase, or deterministic-state change.

# Mobile Impact Window

**Task:** `ux.impact.0001`
**Status:** approved by the standing improvement goal

## Root Cause

The renderer paints the impact monitor at a fixed 220 by 136 logical pixels. Whole-stage CSS zoom reduces that to roughly 144 by 89 physical pixels on the supported phone landscape profile. Existing browser coverage confirms the compositing call but not rendered physical significance, so the player can lose the impact-window feedback without a test failing.

## Decision

SMARTS compared fixed upscaling everywhere, a compact-only scale-aware frame, and a DOM overlay rewrite. The selected route is a compact-only, scale-aware canvas frame: it restores player-visible impact framing without changing renderer ownership, replay state, DOM HUD layering, or the desktop composition.

## Scope

On compact stage scales, the impact monitor must use a larger logical source and frame geometry that preserves a meaningful physical impact window after CSS zoom. It remains centered in the gameplay canvas, copies the strongest live detonation, composes after world transforms, and stays below the DOM HUD. Desktop geometry and reduced-motion behavior remain unchanged.

## Acceptance Criteria

1. A real hot-seat detonation produces a compact impact window whose rendered frame clears a documented physical width and height floor on Pixel touch and small-window projects.
2. The compact source crop, content, and frame stay inside the 1200 by 600 canvas and preserve the monitor's existing strongest-live-burst selection.
3. Desktop monitor geometry remains exactly 220 by 136 logical pixels, with current source crop and draw ordering unchanged.
4. Reduced-motion users retain the static impact monitor without animation or camera state changes.
5. Production-bundle browser coverage observes both the composite and physical compact frame, failing before the repair.

## Exclusions

No changes to engine physics, projectile timing, network determinism, persistence, account behavior, DOM HUD controls, orientation policy, dependencies, Supabase, or migrations.

## Verification

Use focused geometry, painter, and renderer tests; production-bundle impact browser coverage on all viewports; full client tests; deterministic harness; build; dependency audit; staged secret scan; and adversarial exact-diff review. H-05 applies: do not read or edit `.codearbiter/sprint-log.md`.

# singedTerra UI System

This is the living contract for HTML controls around the Canvas battlefield.
The battlefield remains authored Canvas art; the UI system keeps menus,
telemetry, actions, and future screens from drifting into unrelated widget
styles.

## Design direction

The interface is a dense retro-futurist artillery field instrument: compact,
precise, tactile, and readable. It should feel like one machine beside a large
battlefield, not a dashboard assembled from cards.

The current design dials are:

- Structure: 6/10 — one strong rail and clear internal regions.
- Density: 8/10 — information-rich without requiring page or panel scroll.
- Register: 8/10 — direct, technical, and game-like rather than corporate.
- Motion: 4/10 — event-driven feedback only; no decorative idle animation.

## Semantic tokens

Combat UI tokens live in `client/src/style.css`:

- Surfaces: `--ui-rail`, `--ui-surface`, `--ui-surface-raised`,
  `--ui-surface-active`.
- Lines: `--ui-line`, `--ui-line-strong`.
- Copy and action: `--ui-copy`, `--ui-muted`, `--ui-action`,
  `--ui-action-hot`.
- Rhythm: `--ui-space-1` through `--ui-space-4`.
- Shape: `--ui-radius-sm`, `--ui-radius-md`, `--ui-radius-lg`.
- Type roles: `--ui-type-micro`, `--ui-type-label`, `--ui-type-body`,
  `--ui-type-title`.
- Keyboard focus: `--ui-focus`.

Use the semantic role, not a visually similar raw color. Team colors are a
functional identity exception. The ballistic computer may retain its deeper
bezel and authored gauge treatment because it is the rail's focal instrument.

## Composition

- `.st-ui-shell` identifies a coherent application shell.
- `.st-ui-section` provides top-level separator rhythm.
- `.st-ui-action` is an explicit player action.
- `.st-ui-icon-action` is an icon-sized action with an accessible label.
- Top-level regions use separators instead of independent card frames.
- Gold and ember are reserved for current state, focus, and action. Muted
  lavender carries passive labels and navigation.
- The arsenal is a transient in-rail drawer. It starts closed unless the player
  explicitly saved it open, never participates in rail height, and never
  introduces an inner scrollbar.

## Icons and accessibility

`client/src/ui/hudIcons.ts` is the only combat-shell Lucide seam. It imports
exact named icons and must never import Lucide's `icons` registry. Icons
reinforce adjacent text; they do not replace visible labels or accessible
names. Decorative SVGs use `aria-hidden="true"` and `focusable="false"`.

Weapon silhouettes, gauges, tank art, and gameplay effects stay bespoke. An
icon library should standardize familiar interface actions, not erase the
game's own visual language.

## Review checklist

For every new player-facing UI slice:

1. Reuse an existing semantic token or document why a new role is required.
2. Preserve a single viewport with no body or HUD scroll at supported sizes.
3. Test collapsed and expanded/overlay geometry in real Chromium.
4. Keep controls keyboard named and focus-visible.
5. Avoid continuous motion unless it communicates live gameplay state.
6. Measure production bundle cost for any new asset or dependency.

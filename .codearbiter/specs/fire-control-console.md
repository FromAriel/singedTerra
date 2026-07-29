# Fire Control Console Specification

## Intent

Make the right-side instrument cluster an unmistakable artillery fire-control
console while restoring analog telemetry at every supported game scale.

## Proven cause

- The analog gauges were not removed by a recent merge. Their current DOM and
  styling still descend from the visual-overhaul work.
- Since commit `21d3e016`, any app scale below `0.8` deliberately hides the
  analog row and substitutes three plain numeric cells. That responsive
  fallback can look like the richer instrument panel reverted.
- Saved arsenal state does not control instrument visibility.

## Player-visible contract

- One prominent, inset ballistic-computer panel presents elevation and power as
  large upper dials with a full-width wind rail below them.
- Every gauge keeps its live numeric label inside the analog presentation.
- The same analog console remains visible in compact layouts; the plain
  numeric-only substitute is removed.
- Instrument faces use stronger authored bezels, tracks, ticks, needles, and
  contrast so the panel reads at the whole-app zoom used by smaller windows.
- The elevation needle points to the same screen direction as the active
  tank's barrel; a rightward 45-degree shot points up-right, never up-left.
- Elevation and power use the same dial frame, radius, and visual footprint.
- Compact stages collapse the arsenal by default so the fitted HUD does not
  immediately reintroduce an inner scrollbar.
- The existing active weapon row, players, store, arsenal, touch controls, and
  firing state remain in their established order and stay usable.

## Bounds and compatibility

- Gauge values still come only from the existing pure `gaugeMath` helpers.
- No gameplay, input, physics, replay, network action, backend, migration,
  dependency, lockfile, or Supabase contract changes.
- The console remains HTML/SVG in the HUD panel, never Canvas gameplay content.
- The HUD remains free of clipped or crushed direct children across the
  existing desktop, small-window, and compact-touch browser matrix.
- Reduced motion behavior is unchanged; gauge updates remain direct and do not
  add continuous animation.

## Acceptance

1. Unit tests pin one analog representation, semantic gauge layout classes,
   expanded labels, exact wide wind geometry, and live value updates.
2. Browser tests prove the analog grid is visible and boxed inside the HUD in
   every viewport project, including compact layouts.
3. Real-browser comparison confirms a conspicuous two-tier fire-control
   silhouette, correct directional aim, matched primary-dial scale, readable
   telemetry, and no default panel overflow.
4. Focused and full governed verification are green.

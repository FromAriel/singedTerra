# Tank art late-load recovery

## Confirmed production defect

If `art/tank-parts.webp` takes longer than five seconds to load, `TankPartArt` permanently changes from `loading` to `failed` and ignores the later valid decode. The vehicle preview and battlefield then retain geometric fallback tanks until a hard reload. A production Playwright repro delayed only that atlas by 5.5 seconds and reproduced the user's screenshots; a clean reload restored authored models.

## Bounded outcome

- A five-second timeout may release idle rendering and keep fallback art visible, but it must not convert a slow valid atlas or chassis into permanent failure.
- A valid late decode must transition to authored art without navigation or reload.
- Every connected preview canvas displaying that loadout must repaint once when late art becomes ready.
- The battlefield must wake for a bounded repaint after late art becomes ready, without restoring perpetual idle rendering.
- Explicit image errors, invalid dimensions, canvas failures, and draw failures remain terminal fail-soft paths.

## Out of scope

- Replacing tank assets, changing model geometry/loadouts, changing game state or replay behavior, or redesigning the fallback.
- Retrying a genuinely failed or malformed asset.

## Acceptance evidence

- Causal RED tests prove late valid decode is ignored after timeout, preview stays fallback, and a settled battlefield never wakes.
- GREEN tests prove recoverable timeout, one-shot preview repaint, and one bounded battlefield redraw while hard failures remain terminal.
- A real-browser delayed-production-asset regression reproduces then verifies authored preview and battlefield recovery without reload.
- Focused/full tests, build, exact-diff adversarial review, hosted CI, merge, Pages deployment, and live delayed-asset proof pass.

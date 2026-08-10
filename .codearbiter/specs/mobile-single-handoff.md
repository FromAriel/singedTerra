# Mobile Single-Handoff Specification

## Intent

A phone opened in portrait should encounter one decisive landscape-ready launch surface, not dismiss the title splash only to reveal a second full-screen condition. The existing authored portrait launch bay becomes the complete mobile handoff; rotating once reveals the lobby directly.

## Context and SMARTS selection

The delivered mobile landscape launch intentionally waits for `#st-splash` to disappear before enabling its action. That produces the adversarial player-experience audit's remaining P1 mobile finding: splash dismissal and orientation guidance feel like two gates before play.

Three bounded approaches were compared:

1. **Skip the title splash only on initial phone-portrait loads.** The existing portrait launch bay already carries the hero art, title-adjacent visual identity, landscape explanation, fullscreen request, focus trap, and fallback. Rotation reveals the lobby directly.
2. **Teach the title splash to become an orientation controller.** This preserves the exact splash composition but couples a standalone import-time overlay to fullscreen, media-query, focus, and orientation state already owned by `OrientationGate`.
3. **Replace both surfaces with a new universal launch controller.** This could unify every device, but expands a mobile retention repair into a desktop launch redesign and duplicates recently verified behavior.

Approach 1 is strongest across Specific, Maintainable, Achievable, Reversible, Testable, and Secure. It removes one interaction without creating a new controller, dependency, capability, or desktop change. Recommendation strength: strong. Confidence: high.

## Player contract

- A phone-narrow portrait viewport at first load presents the existing authored mobile launch bay immediately; `#st-splash` is never mounted above or behind it.
- The launch bay remains one modal, focus-owned surface with the existing fullscreen/orientation attempt and honest manual-rotation fallback.
- Rotating from phone portrait to landscape reveals the lobby directly. The title splash does not appear late after rotation.
- A phone first loaded in landscape, a phone rotated to portrait after a normal landscape load, and every non-phone viewport keep the existing title-splash behavior.
- The inclusive 480px boundary, the 481px and laptop-size exceptions, reduced motion, keyboard/touch behavior, and deterministic E2E bypass remain unchanged.

## Architecture

- Add one exported phone-portrait media-query helper in `Splash.ts` and use it only at splash mount time.
- If the initial viewport matches `(orientation: portrait) and (max-width: 480px)`, `mountSplash()` returns before injecting style or creating DOM. It does not subscribe for later orientation changes.
- `OrientationGate` remains the sole owner of launch capability requests, focus containment, app inertness, live status, and rotation exit.
- Browser coverage proves the complete initial portrait-to-landscape journey; unit coverage binds the splash skip and non-phone preservation to the production mount function.

## Boundaries

- Client presentation only: `Splash.ts` plus focused unit and production-browser tests.
- No portrait battlefield support, launch-bay redesign, lobby redesign, canvas/HUD reflow, game state, input, engine, network, Supabase, auth, schema, migration, dependency, asset, or lockfile change.
- No branch, worktree, or stale-PR cleanup belongs to this slice.
- The malformed historical `.codearbiter/sprint-log.md` remains untouched under its recorded exception; bounded SMARTS, RED/GREEN, mutation, review, and delivery evidence lives in the spec, plan, exact review package, and delivery receipt.

## Acceptance

- Unit RED proves a phone-portrait match currently mounts the splash; GREEN proves it mounts neither splash DOM nor splash style while desktop, phone landscape, 481px portrait, and absent `matchMedia` retain the splash.
- Production-browser RED proves portrait currently requires splash dismissal; GREEN proves the launch bay is immediately actionable, no splash exists before or after rotation, and the lobby is revealed after one rotation handoff.
- Causal mutations prove removing the skip or making it orientation-only fails the focused tests.
- Focused and full client tests, deterministic checks, Edge tests, production build, complete Playwright matrix, dependency audit, secret scan, exact-package adversarial review, exact-head hosted CI, merge, Pages provenance, and live production health are green.

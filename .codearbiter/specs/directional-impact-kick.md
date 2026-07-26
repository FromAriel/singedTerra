# Directional Impact Kick Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only graphical feedback

## Intent

Give heavy detonations a brief sense of physical force by recoiling the rendered battlefield away
from the blast origin, without pausing or altering deterministic game simulation.

## Decision

The client renderer will derive a bounded two-dimensional camera impulse from explosion position and
radius:

- small blasts retain the existing random shake but add no directional impulse;
- impact kick grows monotonically above a named heavy-blast threshold and caps at a safe viewport
  displacement;
- direction points from the blast toward the canvas center, so the world visibly recoils away from
  the impact;
- simultaneous explosions retain the strongest directional impulse rather than stacking without
  bound;
- the impulse decays independently from the existing random shake;
- reduced-motion users receive neither random shake nor directional kick.

The impulse is presentation state owned by `Renderer`. It never enters `GameState`, the action log,
physics, terrain, replay, or Supabase.

## Acceptance

1. Blasts at or below the small-blast threshold produce zero directional kick.
2. Larger radii produce monotonically stronger kick up to a named maximum.
3. Left/right and above/below impacts kick in opposite directions.
4. Centered impacts remain finite and safe.
5. `Renderer.consumeExplosion` applies the real event position and radius.
6. `Renderer.render` composes directional recoil with existing random shake and decays it.
7. Reset clears all recoil state; `isAnimating` remains true while recoil is visible.
8. Reduced-motion suppresses the new effect.
9. No shared engine, Supabase, dependency, lockfile, workflow, migration, or deployment source
   changes.
10. Focused tests, coverage, root deterministic checks, Edge tests, build, browser guardrails,
    independent review, hosted CI, and Pages provenance are green before completion.

## Non-goals

- pausing engine ticks, action replay, or rendering for hit-stop;
- changing explosion radius, damage, timing, particles, audio, or DOM bloom;
- adding camera zoom, rotation, persistent camera position, dependencies, or WebGL;
- serializing cosmetic camera state.

## SMARTS

Compared with weapon-specific particle branches and simulation-affecting hit-stop, a bounded
event-derived recoil is more maintainable, reliable, testable, and securable while remaining highly
available in Canvas 2D. It makes large weapons feel heavier without opening deterministic or backend
surface. Confidence: high.

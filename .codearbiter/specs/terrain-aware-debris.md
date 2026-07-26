# Terrain-Aware Debris Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only graphical feedback

## Intent

Make explosion and wreck ejecta feel connected to the battlefield by letting falling chunks land
on the current terrain silhouette instead of flying through hills, while preserving deterministic
gameplay and the existing browser-plus-Supabase architecture.

## Decision

The client effects renderer will advance debris through a small, DOM-free swept-collision helper:

- debris continues to use presentation-only velocity, gravity, rotation, lifetime, and randomness;
- each falling step samples the whole motion segment against the current terrain bitmap so a fast
  chunk cannot tunnel through a thin ridge;
- the chunk's lower edge, rather than only its center, determines terrain contact;
- a collision places the chunk at the last clear sample, stops its translation and spin, and leaves
  it visible there for the rest of its existing lifetime;
- a landed chunk re-enters free fall if later terrain deformation removes its support;
- off-canvas positions and malformed or mismatched bitmaps fail open rather than throwing;
- reduced-motion continues to suppress decorative debris entirely.

The helper and `EffectsRenderer` read the authoritative terrain bitmap but never mutate it. Debris
position remains local presentation state and is never serialized, replayed, or submitted.

## Acceptance

1. A falling chunk lands immediately above flat terrain and does not enter a solid pixel.
2. Swept collision catches a ridge crossed by a multi-pixel horizontal/vertical step.
3. A landed chunk remains stationary while supported and resumes falling after support is removed.
4. Rising chunks do not collide with terrain above them.
5. Empty, malformed, and out-of-bounds terrain inputs remain finite and non-throwing.
6. `Renderer` supplies the current `GameState.terrain` bitmap to the effects update each frame.
7. Existing debris spawn counts, colors, lifetimes, reduced-motion behavior, smoke, sparks, and
   informational text remain unchanged.
8. No shared engine, Supabase, dependency, lockfile, workflow, migration, or deployment-source
   changes.
9. Focused tests, coverage, root deterministic checks, Edge tests, build, browser guardrails,
   independent review, hosted CI, and Pages provenance are green before completion.

## Non-goals

- mutating the terrain bitmap or adding gameplay dirt;
- synchronizing cosmetic particles between clients;
- collision for smoke, sparks, projectiles, tanks, or engine entities;
- animated terrain-collapse mechanics;
- particle libraries, sprite assets, WebGL, or dependencies.

## SMARTS

Compared with weapon-specific particle branches, a new asset pipeline, or simulation-affecting
collapse work, terrain-aware ejecta is more maintainable, reliable, testable, and securable while
improving every detonation immediately. It reuses the already-present bitmap and keeps the
performance cost bounded by the small debris pool and short per-frame travel segments. Confidence:
high.

# Weapon-Signature Projectiles Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only graphical feedback

## Intent

Make the weapon roster visually legible during flight. The current renderer draws every projectile
as the same orange orb and smoke trail, so a dirt bomb, napalm shell, cluster carrier, and nuke lose
their identity during the most watched part of a turn.

## Decision

The client projectile renderer will derive a presentation-only visual profile from each
`ProjectileState.weaponType` and `hasSplit` value:

- every implemented projectile weapon receives a stable family silhouette, scale, glow, and trail
  treatment;
- the authoritative weapon definition remains the source for its accent color;
- standard missiles keep a compact hot shell, heavy and nuclear rounds read progressively larger,
  earth movers read as rough payloads, napalm reads as a hot droplet, bouncing betty reads as a
  mine, and airburst carriers/children remain visually distinguishable;
- silhouettes orient to the projectile velocity without modifying that velocity;
- position history remains renderer-local and the existing discontinuity/reset behavior remains;
- invalid velocity components fall back to a finite neutral orientation;
- reduced-motion behavior remains unchanged because the effect is spatial styling, not extra
  motion or flashing.

The profile and drawing state are local presentation data. They are never serialized, replayed,
submitted, or read by the deterministic engine.

## Acceptance

1. Every offensive `WeaponType` maps to a finite, stable visual profile; shield is handled safely
   even though it never creates a projectile.
2. Baby missile preserves the current compact orange-shell visual baseline.
3. Heavy/nuclear, earth-mover, napalm, betty, and airburst families have observably distinct
   silhouettes and trail treatments.
4. Airburst submunitions render smaller than their parent carrier and start with their existing
   clean per-slot history.
5. Shell orientation follows finite velocity and safely falls back for malformed velocity.
6. Projectile rendering does not mutate `ProjectileState` or weapon definitions.
7. Existing history bounds, discontinuity clearing, slot cleanup, rendering order, and renderer
   reset behavior remain intact.
8. No shared engine, Supabase, dependency, lockfile, workflow, migration, or deployment-source
   changes.
9. Focused tests, coverage, root deterministic checks, Edge tests, build, browser guardrails,
   independent review, hosted CI, and Pages provenance are green before completion.

## Non-goals

- changing projectile physics, collision, damage, blast radius, or split timing;
- synchronizing cosmetic trails between clients;
- new bitmap assets, sprite sheets, WebGL, particle libraries, or dependencies;
- changing explosion, fire-field, tank, HUD, audio, or terrain rendering;
- adding new weapons or changing the network action schema.

## SMARTS

Compared with a new asset pipeline, simulation-affecting hit-stop, or broader HUD work, distinct
projectile signatures are more scalable and immediately expose the value of the existing weapon
roster. The renderer already receives `weaponType`, velocity, split state, and bounded history, so
the slice is maintainable, available, reliable, testable, and secure without widening the browser
plus Supabase architecture. Confidence: high.

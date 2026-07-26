# Weapon-Signature Detonations Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Additive shared cosmetic provenance plus client-only graphical feedback

## Intent

Carry each weapon's visual identity through impact. The current renderer reduces almost every
detonation to the same radial fireball with a color swap, so nuclear, earth-moving, incendiary,
conventional, and unusual payloads do not deliver distinct visual payoff.

## Decision

`ExplosionEvent` will carry the authoritative `weaponType` already known by the deterministic
engine when it creates the event. The client will map that value to a bounded presentation-only
detonation profile:

- conventional shells retain the current readable fireball baseline;
- nuclear payloads use a white-hot layered core and contained thermal shock rings;
- dirt and riot payloads use dusty, granular earth blooms;
- napalm variants use a low, hot ignition splash that hands off visually to the existing fire;
- cluster, MIRV, and Death's Head impacts use compact punchy scatter bursts;
- Funky Bomb uses a distinct angular magenta starburst;
- Bouncing Betty remains readable as a chained mine-like pop;
- Shield is handled exhaustively even though it never detonates.

The existing authoritative `radius`, `style`, color, duration, and shared blast-reach contract stay
in force. Profiles may shape and layer pixels inside that reach but must not advertise a larger
damage boundary. They do not alter event order, event lifetime, terrain, damage, physics, replay,
or network actions.

## Acceptance

1. Every `WeaponType` maps exhaustively to a finite, bounded detonation profile.
2. Normal detonation, airburst child, Bouncing Betty hop, and napalm ignition events preserve the
   weapon type that produced them.
3. Conventional, nuclear, earth, incendiary, scatter, funky, and mine families produce observably
   distinct Canvas primitive signatures while retaining their authoritative color.
4. The full-grown outer visual reach remains the existing `blastReachRadius(radius, style)` and no
   family draws beyond it.
5. Burst ordering, deduplication, lifetimes, light flash, scorch, camera kick, debris, audio edges,
   reduced-motion behavior, and renderer reset semantics remain intact.
6. Explosion rendering does not mutate `ExplosionEvent`, weapon definitions, or `GameState`.
7. Hot-seat and networked clients derive the same event provenance from the existing ordered action
   log; no new field crosses Supabase.
8. No dependency, lockfile, workflow, migration, Edge Function, database, auth, or deployment-source
   changes.
9. Focused tests, deterministic harnesses, coverage, Edge tests, build, browser guardrails,
   independent review, hosted CI, and exact-SHA Pages provenance are green before completion.

## Non-goals

- changing damage, crater geometry, blast reach, weapon balance, or simulation timing;
- adding hit-stop, WebGL, shaders, bitmap assets, sprite sheets, or particle libraries;
- synchronizing renderer-local animation state;
- changing projectile, terrain, tank, HUD, shop, lobby, or audio behavior;
- deploying Supabase for a client/shared event-shape change that is derived locally.

## SMARTS

Compared with ambient sky polish, a stale power-meter task, or simulation-affecting hit-stop,
weapon-signature detonations have the strongest immediate combat payoff and compound the preceding
projectile work. The engine already knows the weapon type at both detonation seams, making the
provenance addition specific, maintainable, reversible, measurable, reliable, and testable. The
network and backend contract do not widen. Confidence: high.

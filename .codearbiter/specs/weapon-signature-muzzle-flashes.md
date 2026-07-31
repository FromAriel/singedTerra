# Weapon-Signature Muzzle Flashes Specification

**Status:** Approved under the user's scoped standing passion-project authority
**Scope:** Client-only Canvas launch effects derived from the live projectile weapon

## Intent

Complete the weapon-signature visual lifecycle at the instant of launch. Projectiles, shadows,
detonations, and battlefield lighting now communicate weapon identity, but every barrel still emits
the same generic orange spark cone.

## Decision

The launch transition derives one bounded muzzle profile from the first live projectile's existing
weapon type. The profile selects an accent, motif, scale, spark count, spread, speed, and lifetime.
`EffectsRenderer` retains that short-lived cosmetic flash alongside its existing local particles.

- conventional, heavy, nuclear, earth, incendiary, scatter, funky, and mine families remain
  visibly distinct at launch;
- the flash originates at the shared authoritative barrel tip and follows the barrel angle;
- invalid or absent projectile state falls back to a finite conventional profile;
- reduced-motion suppresses the decorative flash and particles;
- transient state is bounded, culled, and cleared between games;
- no cosmetic state crosses the renderer, action-log, or Supabase boundary.

## Acceptance

1. A pure exhaustive helper returns finite bounded launch profiles for every weapon type.
2. The real launch seam uses the first live projectile weapon and shared barrel-tip geometry.
3. Canvas output binds each profile's accent, motif, scale, and orientation to the matching flash.
4. Caller Canvas state and input state are preserved; multiple launches do not share mutable data.
5. Flash state ages, culls at its exact lifetime, and clears on renderer reset.
6. Reduced motion creates no decorative muzzle flash, sparks, or smoke.
7. Representative families are visibly distinct in a real browser through the real Renderer.
8. No engine, physics, replay, network, Supabase, dependency, or workflow source changes.
9. Focused tests, mutations, full verification, independent review, hosted CI, and exact-SHA Pages
   provenance are green before completion.

## Non-goals

- recoil, projectile velocity, damage, ammo, audio, input, or barrel geometry changes;
- sprite sheets, shaders, WebGL, blur filters, new dependencies, or backend deployment;
- synchronizing random cosmetic particle positions across clients.

## SMARTS

This slice reuses an already-present but ignored muzzle color seam and the existing exhaustive
weapon visual taxonomy. It is bounded to a few particles and one short-lived Canvas primitive per
launch, runs only while effects are active, remains fully testable, and cannot affect deterministic
lockstep. Confidence: high.

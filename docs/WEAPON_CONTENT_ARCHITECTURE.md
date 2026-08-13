# Scalable Weapon Content Architecture

Status: **Slice 1 foundation**

This document defines the permanent direction for growing singedTerra from a small fixed `WeaponType` union into an arsenal that can contain hundreds or thousands of independently-authored weapons without turning every content addition into an engine/UI/referee rewrite.

## Slice 1 boundary

The existing `WeaponSystem.ts` and `GameEngine` remain behavior-authoritative for the original arsenal. The new scalable layer adapts every existing entry into `weaponRegistry` with `execution.kind === 'legacy-core'`.

This is intentional. Content discovery and store selection can migrate first while the deterministic execution contract stays untouched. Later slices can move weapon families from the legacy adapter to composed/custom execution behind stable weapon IDs.

## Three separate concepts

1. **Registry** — every weapon that exists in this build.
2. **Run catalog** — the small seeded subset allowed to appear during one match/run.
3. **Shelf** — the still-smaller subset currently offered by the shop.

A 6,000-weapon registry does not imply a 6,000-row player store.

Normal target shape:

```text
Registry:     600+ weapons
Run catalog:  ~36 weapons
Shelf:        ~9 weapons
```

Developer test shape:

```text
Registry:     ALL weapons
Catalog:      ALL eligible weapons
Money:        effectively unlimited
Legacy ammo:  unlimited in Apocalypse test bench
```

## Adding a simple batch

A routine ten-weapon content batch should eventually look like:

```text
shared/src/weapons/packs/firearms-001.ts
shared/src/weapons/packs/firearms-002.ts
shared/src/weapons/packs/fire-001.ts
...
```

Each pack calls `defineWeaponPack()` and contains validated definitions. Add the pack to the assembled registry index. Registry-wide tests automatically catch duplicate IDs, malformed store metadata, and deterministic catalog regressions.

Stable IDs are namespaced and lowercase:

```text
gun.service_pistol
gun.heavy_revolver
gun.volley_gun
fire.napalm_rain
gravity.local_singularity
comedy.space_turtle
```

Do not encode balance versions into IDs. A weapon keeps its ID when tuning changes.

## Execution kinds

### `legacy-core`

Compatibility adapter for the original fixed arsenal. It points at the existing `WeaponDefinition` and `WeaponType` and therefore executes exactly as it does today.

### `composed`

Future default for the majority of the arsenal. A definition names reusable deterministic primitives such as:

- delivery: direct fire, ballistic, burst, cone, volley, rocket, beam, mine, orbital, rolling, burrowing
- payload: kinetic, blast, fire, cryo, electrical, EMP, terrain-create, terrain-eat, gravity
- modifiers: bounce, split, homing, delayed, proximity, penetration, ricochet

A new pistol/shotgun/machine gun should normally be data, not a new `GameEngine` branch.

### `custom`

Escape hatch for genuinely bespoke deterministic systems: wormholes, singularities, terrain rewind, grey goo, time loops, etc. The registry points at a stable handler ID; the handler is implemented and tested separately.

## Store generation

`StoreCatalog.ts` is deterministic and does not consume global RNG state.

`generateRunCatalog()`:

- filters hidden / arms-level / minimum-round eligibility
- performs deterministic weighted sampling without replacement
- honors exclusive groups
- returns only a bounded subset of the registry

`generateShelf()` rotates a smaller deterministic shelf from that run catalog using `(seed, epoch)`.

`generateFullCatalog()` exists for developer tooling and exposes every eligible definition in stable ID order.

## Apocalypse development sandbox

`client/src/apocalypse/main.ts` is the first consumer of the new registry. It discovers the existing core arsenal through `weaponRegistry`, then executes those entries through their `legacy-core` adapters.

For weapon development it currently uses:

- `economyMode: 'sandbox'`
- `storeMode: 'full_catalog'`
- `Number.MAX_SAFE_INTEGER` credits (finite and JSON-safe, displayed as `$∞`)
- unlimited ammo on every existing legacy inventory slot
- max arms level

The finite credit sentinel is deliberate: JavaScript `Infinity` does not JSON round-trip safely. The normal game economy is not changed by this test-bench bootstrap.

## Rules for future weapon batches

1. Never add a UI-only weapon. A weapon must live in a shared pack/registry.
2. IDs never silently replace each other. Duplicate IDs fail registration.
3. Gameplay randomness must be seeded/deterministic.
4. Presentation randomness may remain client-only and must not feed simulation.
5. Ordinary variants should reuse composed primitives.
6. Use custom handlers only where a composition would become harder to understand or test than bespoke code.
7. Every pack must be reachable from the assembled registry.
8. Registry/catalog tests must remain green before adding the next batch.

## Next slice

The next architectural slice should migrate weapon inventory/action identity from the compile-time `WeaponType` union to runtime-validated `WeaponId`, with sparse inventories and a registry-backed purchase gate. That is the step that allows the first truly new `gun.*` definitions to execute without adding members to `WeaponType`.

After that, implement the first composed execution primitives (`direct_fire`, `burst`, `cone`, `volley`, `kinetic`) and ship the first ten-firearm pack.

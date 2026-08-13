# Scalable Weapon Content Architecture

Status: **Slice 2 foundation**

This document defines the permanent direction for growing singedTerra from a small fixed `WeaponType` union into an arsenal that can contain hundreds or thousands of independently-authored fictional game weapons without turning every content addition into an engine/UI/referee rewrite.

## Architecture

The system separates three concepts:

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

## Slice 1

Slice 1 established the scalable discovery/store layer while leaving the original execution contract untouched:

- `WeaponRegistry` with stable string IDs and validated packs
- `legacy-core` adapters for every existing `WeaponSystem` entry
- deterministic run-catalog selection
- deterministic shelf rotation
- full-catalog developer mode
- sandbox/full-catalog game options
- Apocalypse registry discovery and unlimited-money test mode

The original `WeaponSystem.ts` and `GameEngine` remained behavior-authoritative for the legacy arsenal.

## Slice 2 foundation

Slice 2 begins proving that new content can exist independently of the legacy `WeaponType` union.

### First independent pack

`shared/src/content/packs/direct-001.ts` registers ten direct-fire content entries through `defineWeaponPack()`:

- Light Sidearm
- Service Sidearm
- Heavy Sidearm
- Repeater
- Carbine
- Battle Rifle
- Scattergun
- Auto Scattergun
- Machine Gun
- Volley Gun

These entries are now part of the same global `weaponRegistry` as the legacy arsenal. Adding them did not require adding ten members to the original `WeaponType` union.

### Reusable composition profiles

`shared/src/content/ComposableCatalog.ts` provides reusable abstract game profiles. Profiles are expressed in fictional simulation terms such as pattern, copies, pace, arc width, tick spacing, game impact score, terrain pixels, and presentation color.

The first pack references those profiles by stable ID. This separates authored identity/store metadata from reusable execution tuning and is the intended pattern for large future batches.

### Sparse inventory seam

`shared/src/weapons/SparseInventory.ts` adds a sparse view over the existing plain-object inventory representation:

- absent IDs read as zero finite stock without allocating a row
- rows are created lazily only when needed
- grants increment existing rows
- finite stock is consumed without going below zero
- unlimited test stock uses the existing JSON-safe boolean flag rather than numeric `Infinity`

This is a staged compatibility seam: `TankState.inventory` is still typed as the old exhaustive record, but the runtime representation and clone loop are ordinary string-keyed objects and already preserve additional keys.

### Runtime ID validation

`shared/src/weapons/WeaponLookup.ts` provides fail-closed runtime guards for untyped boundaries. A string is accepted only when the assembled registry contains it, and callers can distinguish composed entries from legacy adapters.

### Automated coverage

`client/src/apocalypse/WeaponRegistry.test.ts` now verifies:

- every original entry still resolves through its legacy adapter
- the registry contains the original arsenal plus the ten-entry Slice-2 pack
- all ten new entries resolve as `composed`
- each Slice-2 entry references a registered composition profile
- an arbitrary future composed definition can be registered without editing `WeaponType`
- duplicate IDs fail closed
- full catalogs, seeded catalogs, arms-level filtering, and shelf rotation remain deterministic after the registry grows

## Pack workflow

Routine future content batches should look like:

```text
shared/src/content/packs/direct-002.ts
shared/src/content/packs/artillery-001.ts
shared/src/content/packs/fire-001.ts
shared/src/content/packs/terrain-001.ts
...
```

Each pack calls `defineWeaponPack()` and is added to the assembled registry. Registry-wide tests catch duplicate IDs and deterministic catalog regressions.

Stable IDs are namespaced and lowercase:

```text
direct.service_sidearm
fire.napalm_rain
gravity.local_singularity
comedy.space_turtle
```

Do not encode balance versions into IDs. A weapon keeps its ID when tuning changes.

## Execution kinds

### `legacy-core`

Compatibility adapter for the original fixed arsenal. It points at the existing `WeaponDefinition` and `WeaponType`, so existing behavior remains unchanged while the migration proceeds.

### `composed`

The intended default for routine variants. A definition references reusable deterministic game-behavior primitives/profiles rather than adding a dedicated `GameEngine` case.

### `custom`

Escape hatch for genuinely bespoke deterministic game systems such as wormholes, singularities, terrain rewind, or other effects whose logic would be harder to understand as a composition graph.

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

`client/src/apocalypse/main.ts` is the first test-bench consumer of the scalable registry. For weapon development it uses:

- `economyMode: 'sandbox'`
- `storeMode: 'full_catalog'`
- `Number.MAX_SAFE_INTEGER` credits, displayed as `$∞`
- unlimited ammo on every existing legacy inventory slot
- max arms level

The finite credit sentinel is deliberate: JavaScript `Infinity` does not JSON round-trip safely. Normal game economy is unchanged by the test-bench bootstrap.

## Migration boundary after Slice 2

The ten new content definitions are registered, catalog-selectable, profile-backed, and compatible with sparse inventory storage, but the production `GameEngine` firing loop and network `PlayerAction` contract still execute only legacy `WeaponType` values.

That boundary is deliberate and visible. New content must not be presented as fireable until its authoritative execution path is in place.

The next engine migration is:

1. promote authoritative action/state identity from `WeaponType` to runtime-validated `WeaponId`
2. make sparse inventory the declared `TankState` contract rather than a compatibility view
3. route registered composed entries through a shared deterministic executor
4. route purchase/select/fire validation through the registry
5. extend referee validation to the same registered-ID contract
6. expose the first ten composed entries as fireable in the Apocalypse test bench

## Rules for future batches

1. Never add a UI-only weapon. It must live in a shared pack/registry.
2. IDs never silently replace each other. Duplicate IDs fail registration.
3. Gameplay randomness must be seeded/deterministic.
4. Presentation randomness may remain client-only and must not feed simulation.
5. Ordinary variants should reuse composed primitives/profiles.
6. Use custom handlers only when composition would be harder to understand or test.
7. Every pack must be reachable from the assembled registry.
8. Registry/catalog tests must remain green before adding the next batch.
9. Registered-but-not-executable content must stay visibly non-fireable until the authoritative executor supports it.

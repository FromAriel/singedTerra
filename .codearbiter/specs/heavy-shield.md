# Spec: Heavy Shield tactical defense

## Outcome

Give players a meaningful defensive choice between the existing Shield and a
stronger, more expensive Heavy Shield. Heavy Shield uses the same turn-ending
`use_shield` action family and deterministic damage-pool semantics, but carries
explicit weapon provenance through the existing network action row so replay
cannot confuse the two capacities.

## Contract

- Add `heavy_shield` as an implemented shield weapon with named price, bundle,
  arms-level, and a larger finite absorption capacity than `shield`.
- A tank may buy and activate Heavy Shield through existing weapon selection and
  the existing `use_shield` action family. Standard `use_shield` rows remain
  backward-compatible and default to the existing Shield.
- The committed action carries the selected shield weapon only when needed;
  no new action kind, database column, migration, or realtime channel is added.
- Heavy Shield absorbs damage through the same pool rules as Shield: overflow
  reaches health, fall damage remains outside the blast shield, and activation
  consumes one round and ends the turn.
- Replaying the same action log produces identical shield capacity, remaining
  pool, health, credits, and turn state.
- Existing Shield and every offensive weapon retain their current behavior.

## Boundaries

In scope: shared weapon/inventory definitions, shield activation and replay
payload, client HUD/store labels and icons, minimal Edge validation allowlist,
AI compatibility (AI may continue choosing standard Shield), deterministic and
client/Edge tests, and player documentation.

Out of scope: auth, persistence, migrations, new dependencies, new action
kinds, changes to fall damage, shield reflection, or progression/profile work.

## Acceptance tests

1. Heavy Shield is buyable/selectable, has bounded starting/purchased ammo, and
   activation spends one round, loads the larger capacity, and ends the turn.
2. A Heavy Shield absorbs a finite hit and leaks overflow exactly like Shield;
   it does not make tanks invulnerable.
3. Standard Shield behavior and legacy `use_shield` replay remain unchanged.
4. Live and replayed Heavy Shield actions produce byte-identical relevant state.
5. Client and Edge tests expose the Heavy Shield without breaking existing
   weapon catalogs or validation.
6. Full local gates, hosted CI, adversarial review, deployment, and production
   health verification are green.

# Spec: Deterministic AI Weapon Personalities

## Intent

Make CPU opponents feel less interchangeable by giving the pure AI planner three deterministic weapon-preference profiles: aggressive, conservative, and area-denial. This expands single-player tactical variety without changing physics, aim search, action logging, or the network referee contract.

## Scope

- Add a shared `AiPersonality` union with `aggressive`, `conservative`, and `area_denial` values.
- Extend `computeAiPlan` with an optional personality input; when omitted, derive one deterministically from the stable AI tank id.
- Apply personality only to the existing deterministic loadout ranking and restock selection:
  - aggressive prefers the strongest available offensive weapon;
  - conservative preserves the current weakest-sufficient-finisher behavior;
  - area-denial prefers napalm, hot napalm, bouncing betty, and cluster-style weapons when stocked, then falls back to the existing ranking.
- Preserve difficulty gates, shield/parachute behavior, seeded aim error, `searchShot`, and all existing action payloads.
- Add deterministic harness coverage for explicit profiles, default derivation, fallback behavior, and same-state replay.

## Acceptance criteria

1. The three profiles produce distinct, documented choices on a controlled stocked loadout.
2. Conservative behavior remains the current weakest-sufficient-finisher policy.
3. Area-denial never selects an unavailable or difficulty-forbidden weapon and falls back safely.
4. Omitted personality input derives the same profile for the same AI id on every run.
5. Existing hard/medium/easy competence, shield, parachute, restock, and byte-identical replay checks remain green.
6. No auth, persistence, migration, secret, dependency, network-action, or referee contract changes occur.

## Explicit non-goals

- No new AI difficulty tier or UI personality selector.
- No weapon physics, damage, aim-search, target-selection, or economy tuning.
- No client/server protocol or stored room schema changes.

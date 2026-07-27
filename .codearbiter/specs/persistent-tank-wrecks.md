# Persistent Tank Wrecks Specification

**Date:** 2026-07-26
**Status:** Approved under standing passion-project authority
**Decision owner:** user

## Problem

An eliminated tank emits turret debris and smoke, but `TankRenderer` continues to
paint the retained `TankState` as an intact, fully colored vehicle. The transient
death sequence and the persistent battlefield therefore contradict each other.

## Decision

Render every non-buried tank with `alive === false` as a static procedural wreck:

- keep the existing terrain contact shadow and a collapsed tread bed;
- replace the intact body with a low, asymmetric charred hull;
- preserve only a muted owner-color remnant for seat identity;
- omit the intact turret, barrel, active-player glow, and active chevron;
- add bounded static metal/scorch details without timers or random values.

The existing `spawnWreck` debris, smoke, and K.O. text remain unchanged and layer
over the persistent silhouette.

## Boundaries

- Client Canvas rendering only; no engine, physics, action-log, or Supabase change.
- The branch is selected solely from authoritative `TankState.alive`.
- No animation loop, new dependency, bitmap asset, or network field.
- Buried-tank ordering and surface beacons retain their current behavior.
- Live healthy and damaged tank rendering must remain behaviorally unchanged.

## Acceptance

1. A dead tank draws a low charred wreck with a muted owner-color remnant.
2. A dead tank does not draw the intact turret/barrel or active-player treatment.
3. Healthy and damaged alive tanks retain their existing paths.
4. The renderer restores caller Canvas state.
5. A real-browser comparison shows healthy, damaged, and destroyed states as
   immediately distinguishable at gameplay scale.
6. Focused tests, complete repository checks, client coverage, Edge tests,
   production build, E2E, diff hygiene, secret scan, independent reviews,
   hosted CI/CodeQL, and exact-SHA Pages provenance all pass.

## SMARTS

Persistent procedural wrecks score above a temporary flash or disappearance:
they are meaningful throughout the round, auditable from `alive`, reversible,
testable through Canvas primitives, securable by remaining presentation-only,
and require no new dependency or synchronized state.

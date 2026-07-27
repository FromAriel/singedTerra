# Shield Impact Ripples Specification

**Date:** 2026-07-26
**Status:** Approved under standing passion-project authority
**Decision owner:** user

## Problem

The shield’s static bubble and charge dots show that protection exists, but an
absorbed hit can reduce `shieldHp` without reducing health. The impact therefore
loses the damage number, K.O. sequence, and tank-state change that make ordinary
hits feel forceful; a major defensive play can read like a miss.

## Decision

Turn each authoritative per-tank `shieldHp` drop into one bounded client-only
impact response:

- expand two short-lived cyan energy rings around the protected tank;
- flash a small set of shield facets around the bubble;
- float a blue `BLOCK NN` readout for the absorbed amount;
- scale intensity within fixed limits rather than directly with unbounded damage;
- suppress moving decorative geometry under reduced motion while retaining the
  informational blocked-damage readout.

The persistent shield bubble remains derived directly from current `shieldHp`.
The transient response is local presentation state and is never serialized.

## Boundaries

- Client Canvas rendering only; no engine, physics, action-log, or Supabase change.
- Trigger only on a strict decrease from a previously observed positive shield
  value; activation, reset, recharge, and first observation silently baseline.
- Keep health-damage numbers independent so overflow may show both shield block
  and health damage truthfully.
- Clear prior shield baselines and transient ripples on renderer reset.
- No new dependency, bitmap asset, wall-clock input, or synchronized field.

## Acceptance

1. A shield decrease produces exactly one bounded visual response with the exact
   rounded absorbed amount.
2. Activation/increase, unchanged charge, first observation, and a zero baseline
   do not produce a false hit.
3. Ripple geometry, lifetime, layering, and Canvas restoration are pinned.
4. Reduced motion keeps the informational text but suppresses moving decoration.
5. Reset clears both detection baselines and live shield-impact visuals.
6. A real-browser comparison shows the response clearly at gameplay scale.
7. Focused tests, complete repository checks, coverage, Edge tests, build, E2E,
   diff hygiene, secret scan, independent reviews, hosted CI/CodeQL, and exact-SHA
   Pages provenance all pass.

## SMARTS

A causal absorption response scores above perpetual shield animation or an asset
pipeline: it is meaningful only when defense matters, auditable from existing
authoritative charge, reversible, testable through Canvas primitives, securable
as presentation-only state, and requires no dependency or backend change.

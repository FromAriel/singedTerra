# Spec: post-impact learning feedback

Date: 2026-08-10

## Outcome

After a locally controlled human shot detonates, the existing Impact Monitor explains where the selected blast landed relative to the nearest opposing tank and names the direction the player should move the next impact. The artillery loop should teach adjustment without changing deterministic gameplay.

## Behavior

- Capture the locally controlled shooter when a shot first enters `FIRING`.
- For each new explosion from that shot, derive a presentation-only cue against the nearest opposing tank. Exclude the shooter and any same-team tank.
- Use shortest wrapped horizontal distance when the battlefield uses wrap sidewalls; otherwise use direct horizontal distance.
- A direct tank impact reads `DIRECT HIT` and `HOLD COURSE` only when the authoritative impact point lies inside exactly one tank collision box and that tank is an opponent. This attribution may include a tank killed by the blast; self, ally, and overlapping/ambiguous geometry fail soft.
- A ground impact within 12 logical pixels of the target line reads `ON LINE` and `HOLD COURSE`.
- Other misses state the rounded horizontal distance and side of the target, then say `SHIFT IMPACT LEFT` or `SHIFT IMPACT RIGHT`.
- The strongest live burst selected by the existing monitor also selects its associated cue.
- The cue is drawn inside the existing monitor at normal and compact presentation scales. It must not create DOM layout, document overflow, or a second overlay.
- Remote-player and CPU shots retain the visual monitor but show no coaching cue.
- Missing, malformed, or ambiguous shooter/target context—including equal-distance opponent ties—fails soft and shows the existing monitor unchanged.

## Boundaries

- Presentation only: no shared engine, action log, Supabase, migration, authentication, persistence, or dependency changes.
- Do not predict a future trajectory or landing point.
- Do not alter impact-window timing, camera kick, reduced-motion behavior, damage, physics, AI, or turn order.

## Acceptance

1. Pure tests cover physically attributed and lethal direct hits, self/ally/overlap suppression, left, right, near-line, wrap, same-team, equal-distance ties, missing-target, malformed-coordinate, and local-shot eligibility cases.
2. Painter tests prove both cue lines render within the existing frame at normal and compact scales and that no cue work occurs when absent.
3. Renderer integration tests prove launch ownership is captured once, the cue reaches the selected monitor burst, reset clears it, and remote/CPU shots receive no cue.
4. Existing impact-monitor geometry, painter, renderer, client, Edge, deterministic, and browser suites remain green.
5. An adversarial final reviewer receives the spec, plan, sprint evidence, tests, mutation evidence, and exact final diff; every Critical, High, and merge-blocking finding is resolved.

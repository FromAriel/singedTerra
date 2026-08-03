# Spec: Deterministic projectile drag

## Intent

Make long shots feel less perfectly ballistic by adding a small deterministic drag
term to the shared projectile integrator. Drag must make wind influence settle toward
a terminal drift instead of accelerating horizontal velocity forever, while preserving
the fixed-step lockstep contract used by hot-seat, AI simulation, and network replay.

## Scope

- Apply one named, bounded drag coefficient during every fixed projectile step.
- Keep the update free of clocks, randomness, and environment-dependent behavior.
- Use the same `stepProjectile` path for live flight and AI forward simulation.
- Add deterministic harness coverage for velocity decay, wind terminal behavior, and
  same-input byte parity.
- Retune only affected deterministic fixtures and document the tuned constant.

## Out of scope

Authentication, persistent users, progression, Supabase changes, migrations, action
payloads, new dependencies, wall behavior, weapons, and renderer changes.

## Acceptance criteria

1. With zero wind, a projectile's velocity loses a bounded, named fraction per fixed
   step, including both horizontal and vertical components.
2. Under sustained fixed wind, repeated steps converge toward a finite horizontal
   terminal drift rather than growing without bound.
3. The live engine and AI forward simulation use the same drag behavior and remain
   deterministic for identical seed and action inputs.
4. Existing collision, wall, weapon, and full client/Edge contracts remain green after
   affected fixture expectations are retuned from observed deterministic output.
5. No auth, persistence, migration, network action, or dependency surface changes.

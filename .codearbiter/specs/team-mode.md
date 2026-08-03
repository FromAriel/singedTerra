# Spec: Deterministic 2v2 team mode

## Intent

Add an opt-in 2v2 ruleset so four-seat games can be played as two teams while
preserving the existing deterministic lockstep and single-tank behavior.

## User-visible contract

- A room may opt into `teamMode` only when it has exactly four seats.
- Team assignment is deterministic: seat indices 0 and 2 are Team 1; seats 1
  and 3 are Team 2. An explicit player `team` value may be carried through the
  existing roster contract, but malformed or missing values fail closed to this
  alternating assignment.
- A team wins a round when it is the only team with at least one living tank.
  A round with no living teams is a draw.
- Teammates cannot damage one another in team mode, including blast, cluster,
  bouncing, and napalm burn damage. Enemy damage and terrain deformation remain
  unchanged.
- Match victory aggregates round wins by team. The public `winner` and
  `lastRoundWinnerId` fields remain tank IDs for transport/UI compatibility; they
  use the first living/lowest-seat tank of the winning team. State also exposes
  `winnerTeam` and `lastRoundWinnerTeam` for unambiguous team presentation.
- Existing non-team rooms, including two- and three-player rooms and legacy
  network rooms without the option, remain byte-compatible in rules and payloads.

## Scope

### In scope

- `GameOptions.teamMode` and per-player `team` typing/normalization.
- `TankState.team` and deterministic construction/reset.
- `GameEngine` team-aware friendly-fire and round/match winner logic.
- Hot-seat and network lobby option transport, including Edge validation and
  stored player/options types.
- Deterministic engine, client transport, and Edge contract tests plus focused UI
  copy/setting coverage where the existing lobby pattern requires it.
- Documentation of team assignment and the deliberate no-friendly-fire rule.

### Out of scope

- Authenticated users, persistence, progression, ratings, or migrations.
- New action kinds, mid-flight network actions, dependencies, secrets, or crypto.
- Manual team swapping, more than two teams, 3v1 balancing, or friendly-fire UI.
- Changes to weapon damage, terrain physics, economy, AI aim, or single-player
  rules outside the team-mode branch.

## Invariants

1. The same seed, options, roster, and ordered actions produce identical team
   assignments and terminal state in hot-seat and network replay.
2. Team mode can never activate for fewer or more than four seats.
3. Legacy omitted team fields do not change non-team behavior.
4. Friendly-fire suppression is applied at the shared damage gate, so every
   damage-producing weapon path observes it exactly once.
5. No client-owned winner or team field is accepted by an Edge referee as an
   authority decision; team data is room configuration/roster metadata only.

## Acceptance criteria

- RED tests fail before implementation for team assignment, teammate immunity,
  team round termination, team match scoring, and transport normalization.
- GREEN focused tests prove all criteria above, including a two-team mutual-kill
  draw and legacy compatibility.
- Full local verification, adversarial review, exact-head hosted CI, production
  smoke, and governed merge complete before delivery.

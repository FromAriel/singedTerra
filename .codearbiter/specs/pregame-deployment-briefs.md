# Pre-game Deployment Briefs

## Objective

Turn the Hot Seat, Create Room, and Join Room setup forms into concise deployment briefs that feel native to the battlefield command surface while retaining every existing action, field, validation rule, and keyboard path.

## Scope

- Give the three immediate commitment routes a shared briefing structure: an explicit route title, a one-sentence operational purpose, grouped setup fields, and one unmistakable commitment control.
- Preserve all current inputs, labels, callbacks, disabled states, validation/status output, Garage access, and advanced-settings disclosure.
- Keep alternative Online routes secondary and reachable.
- Apply the existing dark, squared visual language at desktop and compact landscape sizes without clipping, overlap, or a nested landmark violation.
- Add causal unit and browser coverage for route identity, action priority, and responsive containment.

## Out of scope

- Browse Rooms, Waiting Room, account/progression, Garage internals, Store internals, game rules, lobby protocol, Supabase, auth, migrations, dependencies, and asset generation.

## Acceptance criteria

1. A player can identify whether they are configuring a local battery, creating an online operation, or joining one before scanning individual fields.
2. Each route presents exactly one primary commitment: Start Game, Create Room, or Join Room. Online alternatives stay secondary.
3. Existing field semantics and callbacks remain intact: player and CPU counts, difficulty, visibility, room code normalization, Garage access, advanced settings, status, validation, and busy/disabled behavior.
4. Supported desktop and compact layouts retain an unobscured primary action and do not overflow the fixed stage.
5. Tests prove the new route identity and hierarchy rather than only checking class names.

## SMARTS record

Selected this slice over a Garage or Waiting Room redesign because it covers every pre-game entry commitment, has no protocol or data risk, is reversible CSS and DOM composition work, and creates a concrete pattern for later detail surfaces. Confidence: high.

## Constraints

- Test first. No behavior changes beyond presentation and semantic grouping.
- Reuse the existing deployment shell and visual tokens. No new dependencies.
- Do not read `.codearbiter/sprint-log.md`; H-05 malformed UTF-8 remains active.

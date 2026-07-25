---
status: accepted
date: 2026-07-25
title: Move waiting-room seat-token lifecycle into LobbySession
decided-by: SUaDtL <SUaDtL@users.noreply.github.com>
supersedes: none
governs: client/src/client/LobbySession.ts, client/src/client/LobbyTransport.ts, client/src/ui/Lobby.ts
---

# ADR-0010 — Move waiting-room seat-token lifecycle into LobbySession

## Status
Accepted (the user explicitly approved issue #128's spec and plan on 2026-07-22)

## Context
ADR-0009 split the public seat identifier from the secret per-seat token and required every
mutating request to carry the token. The original client implementation kept the waiting snapshot,
secret token, Realtime channel, heartbeat, browse timer, and waiting-room actions inside the large
DOM-owning `Lobby` controller. Issue #128 extracts that credential-bearing lifecycle into a
DOM-free owner without changing ADR-0009's transport, authorization, or exposure rules.
ADR-0009's prose says the existing localStorage entry is keyed by room id, but the implementation
that decision accepted—and the approved issue #128 spec—key it by public `playerId` so the same
credential remains available across rematches. This ADR corrects that documentation error; it does
not change runtime storage behavior.

## Decision
`LobbySession` owns the in-memory waiting-room snapshot, including the seat token, and supplies the
exact `{ roomId, playerId, token }` credential tuple to `heartbeat`, `readyUp`, `updatePlayer`, and
`leaveRoom`. It also owns the lazy Supabase channel and waiting/browse timers. `Lobby` retains UI
policy and the existing `playerId`-keyed localStorage persistence calls; `LobbyTransport` retains
the wire contract. The token must not enter Realtime payloads, URLs, logs, error text, or any new
persistence.

## Alternatives considered
- **Keep lifecycle and token state in `Lobby`** — rejected because DOM policy and asynchronous
  credential/resource ownership remain coupled in one controller.
- **Pass credentials independently at every call site** — rejected because duplicated snapshots can
  drift across room replacement, cleanup, and delayed responses.
- **Move persistence into `LobbySession`** — rejected because issue #128 is not a storage-policy
  change and the existing `playerId`-keyed localStorage boundary remains deliberate.

## Consequences
Waiting-room credentials and asynchronous resources have one testable owner. `Lobby` becomes a thin
observer/adapter while its forms, persistence, busy/error copy, and game-config conversion remain
unchanged. Delayed operations and Realtime callbacks must be bound to the room/session generation
that created them.

## Risks
A future session method could expose or log the token, eagerly load Supabase on the hot-seat path,
or apply a delayed room-A result to room B. ADR-0009 review, lazy-load tests, exact transport-body
tests, generation guards, and stale-operation regression tests are required controls.

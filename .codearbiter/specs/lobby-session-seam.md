# Lobby Session Seam Sprint Spec

> Status: **APPROVED - user approved 2026-07-22**
> Date: 2026-07-22
> Tracks: GitHub issue #128

## Goal

Extract the online waiting-room state, Realtime subscription, heartbeat ownership, and browse-poll
timer from `Lobby.ts` into a separately testable `LobbySession`, while preserving every current
network request, broadcast transition, render, persisted seat credential, and game-start result.

### Approved implementation amendment

The later review corrections are part of this approved contract. `ready` events identify their source
as `direct` (the successful `ready_up` response) or `realtime` (an active room update), so Lobby
preserves the characterized busy-state ordering for each path while accepting exactly one terminal
handoff per room. The session binds subscriptions, their callbacks, and pending ready/update actions
to the room and generation that created them. A replaced room, cleanup, or leave invalidates older
generations; their delayed loaders, Realtime callbacks, and action results must neither mutate nor
render the replacement state and resolve as stale where applicable. Leave invalidates waiting
resources immediately, before its best-effort request settles.

## Why this is next

Issue #128 was blocked on a lifecycle oracle. PR #164 merged that oracle into `main`, where it now
passes 4/4 and pins subscription filters, resubscription cleanup, heartbeat lifetime, broadcast state,
de-flickering, active-game handoff, and dead-room teardown. The extraction is therefore unblocked.

SMARTS ranks this ahead of issue #129's view decomposition, which explicitly waits for the session
split; issue #134's remaining duplicated harness coverage; issue #109's harmless CSS cleanup; and
security/migration work that would trip a hard gate. The seam also advances the broader issue #85
god-module finding without mixing in view decomposition.

## Current boundary

`LobbyTransport` already owns the seven Edge Function request bodies and responses. `Lobby` still
owns:

- `waitingRoomId`, `waitingRoomCode`, `waitingPlayerId`, and the secret `waitingToken`;
- `waitingPlayers`, `waitingSeed`, `waitingOptions`, and local ready state;
- lazy Supabase loading, the current `RealtimeChannel`, UPDATE/DELETE handlers, and de-flicker
  signature;
- the 10-second heartbeat interval and 3-second browse interval;
- ready-up, self-update, and leave calls that mutate or consume waiting state.

That forces the DOM view to be the lifetime owner of a credential-bearing network session.

## Approaches considered

### A. Observable session service (selected)

Create `client/src/client/LobbySession.ts`. It owns one `LobbyWaitingState`, the lazy Supabase client,
waiting channel, heartbeat timer, browse timer, and the waiting-state operations that use
`LobbyTransport`. It emits a small event union (`changed`, `ready`, `gone`) to `Lobby`.

`Lobby` remains responsible for forms, DOM rendering, online busy/error strings, seat-token
persistence, and conversion to `LobbyConfig`. Its production waiting-view reads and create/join
writes use private accessors backed by the session snapshot, while lifecycle actions delegate to the
session. Those real adapter accessors also keep the already-merged `Lobby.sessionLifecycle.test.ts`
byte-identical without adding a test-only production API.

### B. Mutable state bag plus extracted channel helper

Move fields into a plain object and move only `.channel()`/timer code to helper functions. This is
the smallest diff, but `Lobby` would still orchestrate and mutate every session transition. It would
not satisfy the issue's goal that the view observe a session.

### C. Pure reducer plus effect runner

Model every request and broadcast as reducer actions with a separate effect interpreter. This has a
strong formal boundary, but it rewrites the lifecycle instead of extracting it and adds more state
machinery than this stage-1 project needs.

## SMARTS decision

| Lens | Observable service | State bag/helper | Reducer/effects |
|---|---|---|---|
| Scalable | One event seam can support later lobby views. | New views still duplicate orchestration. | Scales well but adds a framework. |
| Maintainable | One class owns one lifecycle and a narrow event contract. | Ownership remains split. | Many action/effect types for a small flow. |
| Available | Uses current SDK, transport, timers, and oracle. | Also available. | Requires a broader rewrite. |
| Reliable | Extraction is driven by the unchanged characterization oracle. | Easy to retain hidden coupling. | More changed paths increase parity risk. |
| Testable | Direct DOM-free unit tests plus unchanged Lobby oracle. | Helper tests miss aggregate state transitions. | Highly testable but disproportionate. |
| Securable | Secret token stays in one in-memory owner under ADR-0009. | Token remains threaded through the view. | Safe if correct, but more serialization/action surfaces. |

Verdict: **observable session service, strong; confidence high.** Maintainable, Reliable, Testable,
and Securable dominate.

## Design

### Session state

`LobbySession` owns this complete waiting-room value:

```ts
export interface LobbyWaitingState {
  roomId: string
  roomCode: string
  playerId: string
  token: string
  players: NetworkPlayer[]
  seed: number
  options: RoomOptions
  thisPlayerReady: boolean
}
```

Its empty/default value matches today's Lobby field initializers. `replaceWaiting(next)` replaces a
complete value. Lobby's private field-compatible accessors copy one changed value into that snapshot;
the same accessors are used by production create/join transitions and waiting-view reads, so they are
an adapter rather than a test hook.

Replacing room, player, or token identity advances the operation generation. Waiting-channel cleanup
advances both subscription and operation generations. The lazy Supabase loader may be memoized for
concurrent callers, but only a still-current room/generation may install its channel or start a
heartbeat.

### Events

The session emits only:

```ts
export type LobbySessionEvent =
  | { type: 'changed' }
  | {
      type: 'ready'
      source: 'direct' | 'realtime'
      room: { players: NetworkPlayer[]; seed: number; options: RoomOptions }
    }
  | { type: 'gone'; message: string }
```

- `changed` tells Lobby to render after a meaningful broadcast or successful non-terminal action.
- `ready` tells Lobby to build the existing `LobbyConfig` from synchronized room data plus the
  current session identity. `source` preserves the pre-existing direct-ready versus Realtime busy
  ordering; direct ready clears its action busy state before handoff, while Realtime ready does not.
  One room may emit terminal ready only once even if the direct result and Realtime update race.
- `gone` is emitted after the session resets the same waiting fields that `handleRoomGone()` resets;
  Lobby switches to the create view, surfaces the exact existing message, and renders once.

No DOM node, user-facing error policy, or `LobbyConfig` type moves into the session.

### Lifecycle and operations

`LobbySession` owns:

- `subscribeWaitingRoom()` and lazy `../lib/supabase` loading;
- exact UPDATE/DELETE filters for `public.rooms` and `rooms:<roomId>` channel names;
- `cleanupWaitingChannel()`, the channel reference, heartbeat interval, and meaningful signature;
- `startBrowsePoll(tick)`/`stopBrowsePoll()` with the existing 3000 ms cadence;
- `readyUp()`, `updatePlayer(fields)`, and `leaveRoom()` delegating to the injected
  `LobbyTransport` and using the current `{roomId, playerId, token}`;
- adoption of returned players/readiness and direct game-start emission.

Subscription callbacks capture their room and subscription generation. Pending ready/update requests
capture the same seat and operation generation, return a stale outcome when invalidated, and never
alter a successor room. `leaveRoom()` captures its seat, immediately invalidates the waiting channel
and heartbeat, then performs the existing best-effort request.

Create, join, room-list fetching, validation, and visible busy/error strings remain in Lobby. They
are form/view workflows rather than ownership of an established waiting session.

### Lobby integration

Lobby constructs one `LobbySession` with its existing `LobbyTransport` and an event callback.

- successful create/join keeps its existing field assignments, now routed through session-backed
  accessors; it persists the seat token and public session descriptor exactly as today, renders the
  waiting view, and subscribes;
- waiting-room rendering reads `session.waiting`;
- ready, update, and leave handlers delegate to session operations and retain today's exact fallback
  error strings/logging;
- browse navigation delegates timer ownership while `fetchRooms()` continues to own room-list view
  data and stale-response suppression;
- `hide()` delegates both waiting and browse cleanup.

The original lifecycle characterization file remains byte-identical. Private Lobby delegates and
accessors preserve its current typed-through-`unknown` setup while the production implementation
uses the new cohesive session API.

## Security and trust-boundary invariants

ADR-0009 governs the seat credential boundary, and ADR-0010 governs moving its waiting-room lifecycle
into `LobbySession`. This refactor changes ownership, not authorization:

- `playerId` remains public identity; `token` remains the secret credential;
- the token stays in memory and in the existing `localStorage` key keyed by `playerId` only;
- no token enters Realtime rows, room snapshots, logs, URLs, error text, or new persistence;
- every mutating call carries the exact current `{roomId, playerId, token}` body through
  `LobbyTransport`;
- no service-role key, RLS policy, Edge Function, migration, CORS, auth, rate limit, or wire contract
  changes;
- no new dependency or Supabase client construction path is introduced; loading remains lazy so
  hot-seat boot works without Supabase environment variables.

Any discovered need to alter these invariants is a security-controls hard gate and stops the sprint.

## Acceptance criteria

### AC-1: one session owner

- `client/src/client/LobbySession.ts` owns the complete waiting state, Supabase client/channel,
  heartbeat timer, browse timer, and meaningful broadcast signature.
- `Lobby.ts` has no `@supabase/supabase-js` import, `.channel()`, `removeChannel()`, `setInterval()`,
  `clearInterval()`, `waitingHeartbeatId`, or `browsePollId`.
- `Lobby.ts` has no independently stored `waiting*` data fields; same-named private accessors are the
  production adapter for create/join writes and waiting-view reads as well as the unchanged oracle.

### AC-2: exact lifecycle parity

- The existing `client/src/ui/Lobby.sessionLifecycle.test.ts` is byte-identical to `origin/main` and
  passes all 4 tests unchanged.
- Subscription, resubscription, heartbeat, lastSeen de-flickering, active transition, roster removal,
  DELETE handling, and idempotent cleanup retain their exact current behavior.
- The existing `Lobby.network.test.ts`, `Lobby.rejoin.test.ts`, and `Lobby.errorLogging.test.ts` pass
  unchanged.

### AC-3: stateful action parity

- `readyUp()` uses current seat credentials, adopts returned players, marks this client ready, and
  emits `ready` after cleanup when `started` is true.
- `updatePlayer()` uses current seat credentials and adopts a returned player list.
- `leaveRoom()` uses a captured current seat, is still best-effort at the Lobby boundary, and cleans
  the waiting lifecycle immediately before the request settles.
- Existing success, server-error, malformed-response, and thrown-network-error messages remain
  unchanged.
- Ready and player-update results invalidated by a replacement, cleanup, or leave resolve as stale
  outcomes without changing or rendering a successor room.
- Direct and Realtime start races yield exactly one ready handoff and retain their respective busy
  ordering.

### AC-4: browse timer parity

- Entering browse performs the existing immediate fetch and owns exactly one 3000 ms interval.
- Restarting browse replaces the prior interval; leaving browse or hiding Lobby leaves none.
- A response that resolves after navigation still cannot repaint a non-browse view.

### AC-5: direct DOM-free tests and mutation proof

- `client/src/client/LobbySession.test.ts` instantiates the session with fake transport and fake
  Supabase boundaries and creates no DOM nodes.
- It directly covers state replacement, subscription/resubscription, broadcast adoption,
  de-flickering, terminal events, ready/update/leave credentials and state, browse timers, lazy-load
  cancellation/retry, and idempotent cleanup.
- It proves generation-bound stale subscriptions, callbacks, and pending actions cannot resurrect or
  overwrite a replacement room, and proves leave tears down resources before both successful and
  rejected requests settle.
- Durable `LobbySession.lazyImport` and `Lobby.browseLifecycle` coverage proves construction keeps
  Supabase unevaluated until the first waiting subscription, and browse polling fetches immediately,
  keeps its 3000 ms cadence, and stops on navigation or hide.
- Temporary mutations omitting resubscribe cleanup, heartbeat start, player adoption, active cleanup,
  ready-up state adoption, and browse-timer replacement each fail for the intended reason before
  exact restoration.

### AC-6: scope and verification

Fresh verification before commit and PR:

```powershell
npm run check
npm run test:client
npm run coverage:client
npm run check:edge
npm run build
npm run test:e2e
git diff --check
git diff --exit-code origin/main -- client/src/ui/Lobby.sessionLifecycle.test.ts client/src/ui/Lobby.network.test.ts client/src/ui/Lobby.rejoin.test.ts client/src/ui/Lobby.errorLogging.test.ts package.json client/package.json shared/package.json package-lock.json supabase .github/workflows
```

The PR closes issue #128 and remains subject to the user's later standing project-scoped authority to
merge a clean, reviewed, green PR and deploy verified artifacts. Security/auth/crypto changes,
destructive data operations, and spending remain separate hard gates.

## Non-goals

- Decomposing Lobby render methods or starting issue #129.
- Moving create/join form validation, room-list display state, or `LobbyConfig` construction.
- Changing request bodies, response handling, Realtime filters, heartbeat/browse cadence, copy, or
  persistence behavior.
- Changing auth, seat-token policy, RLS, Edge Functions, migrations, dependencies, lockfiles,
  workflows, or deployment state.
- Adding a reducer framework, public test hooks, live Supabase tests, or browser waits.
- Bypassing the standing review, green-check, security, destructive-operation, or spending gates for
  merge or deployment.

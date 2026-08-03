# Networked Quick Chat Specification

## Goal

Give players a small, safe way to communicate during a networked match without adding free text, persistence, or entries to the deterministic action log.

## Acceptance criteria

1. Networked rooms expose exactly six fixed quick-chat messages: `nice_shot`, `watch_wind`, `your_move`, `good_game`, `oops`, and `ready`.
2. Sending transmits only `{ key, playerId }` on a dedicated Supabase Realtime Broadcast event scoped to the room. It never calls an Edge Function, mutates Postgres, or appends to `room_actions`.
3. Receivers accept only known catalog keys and known roster player IDs, resolve the sender name from the synchronized roster, and display a transient accessible toast using text content rather than HTML.
4. A sender cannot emit more than one message per 800 ms. A failed or unavailable channel is non-fatal and does not affect gameplay or connection-state handling.
5. The HUD presents an accessible keyboard- and pointer-operable quick-chat control in networked games, while hot-seat games do not create or require a network channel.
6. Tests prove catalog validation, rate limiting, payload shape, receiver filtering/name resolution, HUD accessibility, and channel teardown. Existing deterministic, Edge, client, build, and E2E gates remain green.

## Boundaries

- Modify only client networking/UI/style/test surfaces and governed artifacts.
- No free text, arbitrary markup, auth, persistence, migrations, secrets, dependencies, deterministic engine/state/action changes, or moderation system.
- Broadcast messages are ephemeral and are not replayed after reconnect or rematch.

## Error and safety behavior

- Unknown keys, unknown senders, malformed payloads, and messages received after teardown are ignored.
- Catalog labels are constant project-owned strings. Sender names are inserted with `textContent`.
- Broadcast send failures are swallowed after an optional diagnostic warning; the game remains playable.

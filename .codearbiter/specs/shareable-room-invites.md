# Shareable Room Invites Specification

## Intent

Turn online-room recruitment from a read-and-retype code exchange into one
copyable link that lands the invited player directly on a prefilled Join Room
screen.

## Player-visible contract

- A waiting-room host sees the existing four-character room code and a prominent
  `Copy invite link` action beside it.
- A successful copy produces an immediate, non-modal `Invite copied` status that
  is announced to assistive technology.
- The copied URL preserves the current deployment path, contains only a
  normalized four-character `join` parameter, and never embeds room ids, player
  ids, seat tokens, Supabase credentials, or other session data.
- Opening a valid invite URL selects Online play, opens Join Room, and prefills
  the exact normalized room code. The player still chooses their own name and
  color and explicitly submits Join Room.
- Missing, malformed, or overlong invite parameters are ignored and preserve the
  normal Hot-seat landing view.
- If clipboard access is unavailable or rejected, the lobby stays usable and
  shows a concise error instead of claiming success.

## Technical contract

- URL construction and parsing live in a small pure helper with strict validation
  through the existing room-code contract.
- URL construction removes unrelated query parameters and fragments so local
  E2E flags, stale invite parameters, and arbitrary tracking data are not shared.
- Clipboard interaction stays behind the browser Clipboard API; no dependency is
  added because native URL and clipboard primitives fully cover the bounded need.
- Invite parsing happens when the lobby is constructed, before its first render.
- The flow is presentation and navigation only. It does not auto-join, call an
  Edge Function, alter room visibility, or change Realtime/session behavior.

## Bounds

- No database, migration, Edge Function, Supabase, authentication, room schema,
  action-log, engine, physics, replay, or deployment change.
- No Web Share API, QR code, account/contact integration, analytics, or paid
  service in this slice.
- Existing manual code entry and public-room browsing remain intact.

## Acceptance

1. Pure unit tests pin path preservation, strict normalization, query/hash
   stripping, and malformed-code rejection.
2. Lobby tests pin valid invite routing, invalid invite no-op behavior, exact
   clipboard payload, accessible success, and rejected-copy feedback.
3. A production-browser test opens a valid invite URL and proves Online / Join
   Room / prefilled code without issuing a join request.
4. Focused and full governed verification are green on a ready stacked PR; the
   PR is not merged and nothing is deployed.

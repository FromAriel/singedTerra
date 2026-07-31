# Tank Garage Loadouts Specification

## Goal

Turn the modular tank seam into visible player expression: every seat can choose
and mix authored treads, hull, turret, and barrel styles before battle, with the
same result in hot-seat and networked play.

## Player contract

- The lobby exposes a compact Garage for each locally editable seat.
- Each of the four slots can independently select `foundry`, `ranger`, or
  `bulwark`; choosing a complete preset remains a one-action shortcut.
- A live preview uses the same atlas cells, tint behavior, mount points, and
  fallback rules as the battlefield renderer.
- The existing `foundry` selection is the default for old rooms, omitted data,
  invalid client data, loading failures, and players who never open the Garage.
- Customization is free and cosmetic. It has no unlocks, prices, stats, hitbox,
  collision, aim, damage, economy, or weapon effects.

## Art contract

- Each new kit is authored first as one coherent side-view chassis plus matching
  barrel at the real gameplay footprint, then partitioned into compatible slot
  cells. Individual source illustrations are not stacked as independent tanks.
- Every kit shares the existing surface anchor, barrel pivot, and exact
  `BARREL_LENGTH` muzzle contract.
- All twelve cells live in one transparent, base-aware WebP atlas. The existing
  foundry row reconstructs the currently approved chassis exactly.
- Color tint preserves material highlights and silhouette readability at the
  smallest supported gameplay scale.

## Hot-seat and network contract

- Hot-seat loadouts travel through `LobbyConfig` and `GameOptions` into
  presentation metadata on each tank.
- Network loadouts are a bounded, allowlisted field on the existing player JSON
  roster. `create_room`, `join_room`, and authenticated `update_player` validate
  it; Realtime, rejoin, game start, and rematch preserve it.
- Missing loadouts from old rooms normalize to the complete foundry preset.
- The room action log and deterministic physics inputs do not change. Rendering
  is the only consumer of loadout metadata.

## Constraints

- No database migration, new dependency, service-role exposure, authentication
  change, or client-side database write.
- Existing seat-token authorization and waiting-room-only update rules remain
  intact.
- The client must remain playable if the atlas cannot load or an older room has
  no customization field.

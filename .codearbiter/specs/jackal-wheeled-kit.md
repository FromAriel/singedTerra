# Jackal Wheeled Tank Kit Specification

**Status:** approved under the standing passion-project sprint authority
**Owner:** SUaDtL
**Date:** 2026-07-30

## Problem

The Garage now offers three visually legible mobility classes, but every slot
still has only three choices. Adding a new customization slot would expand the
network payload and old-room fallback surface; adding physics by chassis would
make cosmetics affect deterministic play. The highest-value bounded expansion
is a fourth complete family that uses the existing four-slot loadout contract
and is unmistakable at battlefield scale.

## Goal

Add the **Jackal**, a fast-looking wheeled raider family whose four authored
parts can be selected as a preset or mixed independently with Foundry, Ranger,
and Bulwark parts in hot-seat and networked play.

## Visual identity

- **Jackal Wheels:** four exposed dune wheels with visible hubs and suspension;
  no tread belt, spider legs, or hover skirt.
- **Jackal Raider:** a lean, sloped hull with an open roll-cage silhouette.
- **Jackal Ring:** a compact circular turret ring with a scavenger sensor mast.
- **Jackal Howitzer:** a short, heavy barrel with a visibly flared muzzle.
- The complete family reads as a coherent desert raider while every individual
  part remains independently recognizable at the live 36-by-24 tank envelope.
- Art direction remains high-detail painterly pixel art with transparent
  surroundings, the established dusk palette, neutral steel barrel treatment,
  and player tint on chassis parts.

## Data and compatibility contract

- `jackal` is appended to the existing `TankKitId` allowlist; existing enum
  ordering and the complete Foundry default remain unchanged.
- The loadout object retains exactly `treads`, `hull`, `turret`, and `barrel`.
  No new field, migration, dependency, price, unlock, or gameplay stat is added.
- Old/omitted/invalid room values still normalize to the complete Foundry
  preset. Complete valid Jackal and mixed loadouts round-trip exactly.
- Shared/browser and Deno boundary validators accept the same four kit IDs and
  continue to reject partial, unknown, array, and over-posted values.
- Create, join, update-player, rematch, Realtime, and hot-seat handoffs preserve
  Jackal values exactly.
- The kit remains presentation-only: collision, fuel, movement, barrel geometry,
  projectile spawn, AI, action logs, and deterministic replay do not vary by kit.

## Atlas and rendering contract

- The authored atlas grows from three to four 128-pixel rows while retaining
  four 256-pixel columns and the existing part order.
- Existing Foundry, Ranger, and Bulwark source cells remain byte-for-byte
  visually unchanged.
- The Jackal row satisfies the same alpha, occupied-area, ground-anchor, mount,
  tint, cache, and barrel pivot/muzzle contracts as every existing row.
- All four complete family silhouettes and all four mobility silhouettes are
  materially distinct after gameplay-scale downsampling.
- The rendered Jackal barrel, shared aim guide, muzzle flash, and projectile
  spawn remain coaxial through the existing `barrelTip()` contract.

## Garage and responsive contract

- A fourth **Jackal** preset appears alongside the existing three.
- Slot controls expose concise descriptive visible labels and accessible current
  values: Dune Wheels, Raider Hull, Sensor Ring, and Howitzer.
- Preset and per-slot cycling include Jackal without changing focus restoration,
  modal semantics, keyboard trapping, or persistence behavior.
- The four-preset layout remains fitted without page scroll or clipped controls
  on desktop, pixel-touch, and small-window projects.

## Verification

- RED/GREEN unit tests pin the four-ID allowlist, Foundry fallback, exact Jackal
  parsing, catalog row geometry, labels, preset selection, and mixed cycling.
- Asset/browser tests pin 1024-by-512 dimensions, sixteen occupied transparent
  cells, four-way silhouette distance, shared mount/muzzle occupancy, and exact
  preservation of the first three rows.
- Causal browser tests prove a Jackal preset and mixed Jackal parts reach the
  live renderer at gameplay scale with zero scroll.
- Network and Edge tests prove create/join/update/rematch persistence and reject
  malformed values at both boundaries.
- Deterministic, client, coverage, Edge, build, E2E, audit, diff, secret, review,
  exact-head hosted CI, deployment, and public-live gates remain required.

## Out of scope

- Wheel rotation, suspension animation, mobility-specific sounds, speed/fuel
  bonuses, hitbox changes, purchases, unlock progression, or extra loadout slots.
- The separately queued Sandhog/Tunneler weapon.

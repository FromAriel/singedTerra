# Apocalypse Mode

Apocalypse Mode is an opt-in experimental ruleset layered on top of singedTerra's production deterministic artillery engine.

It exists for one reason: preserve the original game's serious deterministic core while giving experimental weapons permission to become ridiculous.

## Architecture

The mode is intentionally a sidecar rather than a mutation of the canonical network ruleset.

```text
apocalypse.html
    |
    +-- Renderer ----------------------> canonical singedTerra presentation
    |
    +-- ApocalypseOverlay ------------> exotic client-only visual layer
    |
    +-- ApocalypseEngine
            |
            +-- GameEngine -----------> canonical terrain / tanks / wind / economy
            |
            +-- special weapon rules -> same live GameState bitmap and TankState rows
```

Canonical weapons still call `GameEngine.applyAction()` and `GameEngine.tick()` exactly as the normal game does. While an Apocalypse weapon is active, the sidecar owns the fixed-step sequence, mutates the same authoritative terrain/tank snapshot through deterministic operations, then returns control to the normal engine at the next turn.

This separation is deliberate. It means the existing online action contract is not silently changed by experimental weapon physics. Apocalypse Mode has its own explicit action-log format and can evolve behind a new ruleset boundary.

## God-tier arsenal

### Rift Lance

A coherent energy shear fired directly along the barrel vector. It cuts a narrow corridor through any amount of terrain and damages tanks intersecting the beam. The beam is a line weapon, not a ballistic shell.

### Singularity Seed

A normal ballistic launch that becomes abnormal on impact. The seed establishes a temporary gravity well, pulls nearby tanks horizontally, eats terrain in deterministic pulses, deals proximity damage, then collapses into a final crater.

### Skybreaker

Uses the live ballistic firing solution to range a target, paints it, then calls down a vertical orbital lance. The beam clears a narrow column through the entire world slice and produces a major surface blast at the target.

### Chrono Echo

Replays the same firing solution three times with small deterministic phase offsets. Each echo has its own flight trail, collision, damage, and crater, so the weapon can walk itself across a target rather than faking a multi-hit visual.

### Wormhole Pair

The weird one. It opens two linked portals: one at the ranged impact point and one at its antipodal world position. Circular terrain samples are swapped between the two portals, including their material bytes. Living tanks caught inside a portal are translated with the exchanged geography.

### Planetcracker

A ranged target marker calls a hypersonic penetrator from above. The spear transitions from atmospheric drop to an underground drill phase, clearing a narrow shaft as it descends. Its terminal event excavates a deep core and propagates lateral fracture cavities before terrain gravity settles the result.

## Determinism

Gameplay-affecting Apocalypse behavior uses fixed ticks and deterministic arithmetic only. It does not use `Math.random()`.

Visual-only overlay jitter may derive from integer hashes of sequence id / tick. Presentation never feeds back into the simulation.

The mode records accepted canonical actions, special fires, and special purchases in a JSON-exportable sidecar action log with the world seed.

## Build

`client/apocalypse.html` is a second Vite HTML entry. The production build emits both the normal game and Apocalypse Mode.

```bash
npm install
npm run check
npm run test:client
npm run build
```

Then serve the production output and open `/apocalypse.html`.

## Controls

- Left / Right: angle
- Up / Down: power
- A / D: movement (spends canonical fuel)
- Space / Enter: fire
- G: trajectory guidance
- Heavy Shield button: canonical finite shield action
- Weapon selector: switches between the canonical singedTerra arsenal and Apocalypse weapons

Apocalypse Mode starts both tanks with an elevated bankroll, power cap, and fuel allocation so the mode demonstrates the full systems space rather than making the player grind before seeing the experimental content.

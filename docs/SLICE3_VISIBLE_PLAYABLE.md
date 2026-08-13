# Slice 3 — Visible + Playable

Slice 3 turns the scalable-content foundation into something a developer can immediately see and exercise after starting the client.

## Launch surface

Run the repository normally:

```text
npm install
npm run dev
```

Open the URL printed by Vite. The default page now presents three explicit choices:

- **Classic** — the existing production game underneath the launcher.
- **Apocalypse** — the sandbox/test-range ruleset.
- **Arsenal Lab** — the live registry inspector.

Direct development URLs remain available:

```text
/apocalypse.html
/arsenal.html
/apocalypse.html?weapon=direct.machine_gun
```

The Vite production build emits all three HTML entries.

## First composed batch

The ten definitions from `direct-001` are now playable in the Apocalypse test range.

The bridge is deliberately staged:

1. `PlayableDirectBridge` installs generic impact adapters into the existing engine lookup.
2. `ComposedEngine` performs the selection and shot commitment through the production `GameEngine`.
3. Before the first simulation tick, that one committed projectile is expanded into the authored `tap`, `pulse`, `fan`, or `wall` copy pattern.
4. From tick 1 onward, ordinary `GameEngine` code owns collision, walls, impact resolution, shields, scoring, terrain state, collapse, and turn rotation.
5. `ComposedOverlay` renders the additional streak presentation only; it never feeds data back into simulation.

There is no per-item switch in the engine. A future direct composed entry becomes playable by providing a valid registry definition/profile supported by the bridge.

## Sandbox

Apocalypse remains the development sandbox:

- finite JSON-safe effectively-unlimited credits
- unlimited legacy stock
- unlimited stock for every playable composed ID
- max arms level
- full registry discovery

Arsenal Lab deep-links a playable registry entry directly into the test range through the `weapon` query parameter.

## Network boundary

Slice 3 deliberately does **not** broaden the shared online/referee contract to composed emission patterns. The test range bridge proves the content/runtime seam without silently changing multiplayer semantics. Engine-native `WeaponId`, sparse state, shared composed dispatch, content-manifest skew protection, and referee migration remain the next shared-contract step.

## Acceptance checks

Before merging, verify:

- the default page visibly presents all three modes
- Classic still launches
- Apocalypse contains a `COMPOSED DIRECT` group with ten entries
- each composed entry commits and resolves
- multi-copy entries visibly emit multiple projectiles
- Arsenal Lab lists the live registry and searches it
- a Lab link opens the selected entry in Apocalypse
- `npm run build` emits `index.html`, `apocalypse.html`, and `arsenal.html`
- the composed execution test remains deterministic for the same seed

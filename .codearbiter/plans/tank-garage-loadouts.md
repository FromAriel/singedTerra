# Tank Garage Loadouts Implementation Plan

### Task 1: Bounded cosmetic contract

- [x] Write failing tests for exhaustive slot normalization, default fallback,
  engine propagation, and zero simulation reads.
- [x] Add the shared client/engine loadout types and renderer selection data.
- [x] Write failing Edge tests, then add allowlisted create/join/update handling
  and rematch preservation without a migration.

### Task 2: Coherent authored kit atlas

- [x] Author Ranger and Bulwark as complete gameplay-scale assemblies with
  matching barrels, then partition them into compatible exclusive cells.
- [x] Extend the atlas loader/painter for three rows and mixed slot selections.
- [x] Prove all twelve cells, common mounts, tint contrast, load settlement, and
  exact foundry visual compatibility.

### Task 3: Garage interaction

- [x] Add a compact preset-and-slot Garage to hot-seat rows and network forms.
- [x] Reuse the production art path for live previews and preserve accessible
  names, focus, touch targets, and the single-screen gameplay layout.
- [x] Prove create, join, edit, Realtime, rejoin, start, and rematch propagation
  plus real-browser interaction across all viewport profiles.

### Task 4: Governed delivery

- [x] Complete one adversarial review and correct every Critical/High finding.
- [x] Run the complete local gate.
- [x] Commit, open a ready PR, and require exact-head hosted green.

# Online Lobby Action Hierarchy Plan

Task: `ux.menu.0004`

## Constraints

- Client UI only: preserve the existing `onCreate`, `onJoin`, `onBrowse`, and `onJoinByCode` callbacks, busy gates, fields, and online subview transitions.
- Use one semantic navigation group with the accessible name `Other ways to play online`; do not create a router, network request, or duplicate action path.
- Test first. The canonical sprint log cannot be appended because of the documented H-05 broken-UTF-8 defect; keep that scoped exception intact.

## Steps

1. Add a failing `LobbyOnlineRouteActions` unit test describing a primary action followed by an accessible alternative-route navigation group, its direct route labels, and callback behavior.
2. Add the smallest reusable action builder, then route Create, Join, and Browse through it. Keep Create/Join primary action labels and busy behavior unchanged; Browse keeps its per-room Join actions and uses the builder only for its alternatives.
3. Update the existing Create, Join, Browse, and browser layout tests to prove all routes retain their callbacks, busy states, grouped navigation semantics, and reachability across current viewport projects.
4. Run focused UI tests, full client tests, deterministic checks, build, audit, and the relevant lobby browser suite. Preserve unrelated running preview servers; use hosted E2E as the full clean-machine authority if the fixed local port is occupied.
5. Give one adversarial reviewer the spec, plan, sprint-log exception, tests, and exact final diff. Resolve every Critical, High, and merge-blocking finding, re-review the exact final diff after corrections, then commit, PR, exact-head hosted CI, guarded merge, Pages deployment, and production health receipt.

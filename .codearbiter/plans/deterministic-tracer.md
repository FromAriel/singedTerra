# Plan: Deterministic tracer ranging shot

1. **RED shared contract** - add focused engine/replay tests for tracer inventory,
   zero-damage/no-terrain impact, turn completion, and same-action replay parity.
2. **GREEN shared engine** - add the tracer weapon definition and starting stock;
   route its impact through a named non-destructive detonation branch while retaining
   the normal projectile and `fire` log contract.
3. **RED client contract** - add focused HUD/renderer tests for tracer selection,
   ammo/store labeling, the cyan impact marker, and a malformed marker event.
4. **GREEN client** - expose the tracer through existing weapon cycling/store and
   render its marker without changing the launch guide or input semantics; make the
   explosion visual catalog fail soft to the baby-missile baseline for malformed
   runtime provenance.
5. **GREEN network boundary** - add only `tracer` to the existing `submit_action`
   weapon allowlist and its validation test; do not change authorization or payload
   shape.
6. **Verification** - run focused RED/GREEN cycles, then `npm run check`,
   `npm run check:edge`, `npm run test:client`, `npm run typecheck`, `npm run build`,
   `git diff --check`, and the state-free secrets scan.
7. **Review and delivery** - give Euler the spec, plan, sprint log, task board,
   focused/full test evidence, and exact final diff; resolve all findings, commit
   through the commit gate, open a PR, wait for exact-head hosted checks, merge,
   deploy the client if applicable, verify live health, and append the delivery
   receipt before selecting the next slice.

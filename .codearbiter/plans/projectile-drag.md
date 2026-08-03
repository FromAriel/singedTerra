# Plan: Deterministic projectile drag

1. **RED shared physics contract**: add a failing motion harness assertion for zero-wind
   velocity decay and bounded sustained-wind drift.
2. **GREEN integrator**: add a named drag coefficient to `stepProjectile` with a fixed
   update order that remains deterministic and shared by live and simulated shots.
3. **Parity and fixture sweep**: prove engine/AI simulation parity, run the full
   deterministic chain, and retune only exact affected expectations.
4. **Full verification**: run Edge, client, typecheck, build, E2E, diff, and secrets
   gates; append receipts to the sprint log.
5. **Adversarial review and delivery**: send the spec, plan, sprint log, tests, and
   final diff to Euler, resolve all blockers, then commit, PR, host-validate, merge,
   deploy, smoke-test, and close the task.

# Plan: Heavy Shield tactical defense

1. **RED shared contract** - add failing tests for the Heavy Shield definition,
   activation capacity, finite overflow, and action replay payload while pinning
   standard Shield compatibility.
2. **GREEN shared engine** - add the named Heavy Shield definition and inventory;
   extend `use_shield` with an optional shield weapon provenance field and route
   capacity through the selected definition without changing damage-pool rules.
3. **RED/ GREEN network contract** - add the minimal Edge validation test and
   allowlist entry for Heavy Shield, preserving auth, authorization, and payload
   compatibility for existing rows.
4. **RED/ GREEN client presentation** - add store/HUD/icon expectations first,
   then expose Heavy Shield through existing selection and firing callbacks.
5. **Verification** - run focused harnesses/tests, then full check, Edge tests,
   client tests, typecheck, build, E2E, diff check, and state-free secrets scan.
6. **Review and delivery** - give Euler this spec, plan, sprint log, task board,
   tests, and final diff; resolve all findings, merge the exact reviewed head,
   deploy client and Edge function changes without migrations, verify production,
   and record the receipt before selecting the next slice.

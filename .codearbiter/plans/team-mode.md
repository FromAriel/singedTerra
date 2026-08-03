# Plan: Deterministic 2v2 team mode

1. Add the RED deterministic harness cases first: four-seat assignment, omitted
   or invalid teams, friendly-fire immunity across blast/burn paths, team-only
   round termination, aggregate match winner, and legacy two-player parity.
2. Add shared team types and construction/reset plumbing. Normalize activation to
   exactly four seats and derive stable alternating teams when roster metadata is
   absent or invalid.
3. Add the minimal engine rules: suppress same-team damage at the shared damage
   gate, count alive teams, award team round wins deterministically, and expose
   winner-team state while retaining tank-ID compatibility fields.
4. Thread the opt-in setting through the existing hot-seat/network lobby and
   Edge room contracts. Validate it fail-closed; preserve old room payloads when
   omitted. Add focused client/Edge tests before broad verification.
5. Run the full local matrix, secret scan, and diff checks. Package the spec,
   plan, sprint log, task board, tests, and final diff for Euler adversarial review;
   resolve every Critical, High, Medium, and merge-blocking finding.
6. Commit only the reviewed scope, open the PR, wait for exact-head hosted checks,
   merge under standing authority, deploy affected client/Edge surfaces, verify
   production health, and append the delivery receipt.

## Deliberate boundary

Manual team selection and persistent progression are separate slices. This plan
optimizes for a deterministic, replay-safe ruleset that can ship without auth,
schema, or new action-protocol changes.

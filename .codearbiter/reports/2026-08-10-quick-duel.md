# Delivery receipt: Quick Duel versus CPU

Date: 2026-08-10

Scope: The pre-game command shell now offers one obvious Quick Duel versus CPU action from either setup route. It starts a hot-seat match with the current commander and one medium CPU, preserves the commander's trimmed name, color, and normalized loadout, and emits no Advanced Settings.

## Test-first evidence

- Integration coverage failed first when the launch callback was disconnected and when the human seat inherited an AI flag.
- Browser coverage failed first when the action was hidden after selecting Play Online and when the briefing introduced document overflow.
- Payload mutations proved the tests reject a hardcoded CPU color and an always-fallback commander name. The nonblank fixture also requires both emitted name fields to use the trimmed value.
- Comparative browser evidence showed that a dedicated Quick Duel row caused five containment failures, so the corrected briefing shares the existing mode rail.

## Verification

- `npm run check`: deterministic harnesses and strict typechecking passed.
- `npm run test:client`: 1096 tests passed on the adversarially reviewed behavior payload; the exact PR head passed 1097 client tests after the coverage correction.
- `npm run check:edge`: 267 tests passed.
- Isolated Playwright verification: 243 passed, 30 expected skips.
- `npm run build`: passed.
- Canonical secrets scan returned `[]`.
- The final reviewer package was bound to the exact staged diff and included the spec, plan, sprint evidence exception, tests, mutation evidence, and final diff.

## Review and delivery

- The adversarial final reviewer found no remaining Critical or High issue after malformed package evidence and causal mutation gaps were corrected.
- The required all-path coverage audit found one merge-blocking Medium gap: both payload fixtures used blank commander names. A nonblank whitespace-trimming case killed the always-fallback mutation, and the auditor returned CLEAR on the correction.
- One non-blocking Low observation remains: the fixed 46-pixel briefing height may clip under unsupported enlarged text-spacing or fallback-font conditions.
- The adversarial final package cleared the `0af6ca137d2330466102fba23b9b511e10b30e1e` behavior diff. The coverage auditor then reviewed and cleared the staged name-test correction that became exact PR head `04a2f528fd9d3c494009b680ca6b14e0781ebf2b`.
- PR #372 merged as `71f514b082dd1c825a8900147d26a62bce0176d2` after CI run `31364988677`, CodeQL run `31364988699`, CodeRabbit status, and hosted rendering checks passed on exact head `04a2f528fd9d3c494009b680ca6b14e0781ebf2b`.
- GitHub Pages run `31365394947` passed build, current-main verification, deployment provenance, and post-deploy live smoke. Direct production health returned HTTP 200, and `deploy-meta.json` reported the exact merge SHA and run ID.
- No Supabase source changed, so no backend deployment was required.

## Next selected slice

- Add post-impact learning feedback that tells a player how the shot missed and what direction to correct. This is the highest-value remaining player-retention finding in the adversarial experience audit and aligns with the requested impact-window experience.

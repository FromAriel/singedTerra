# Tank art late-load recovery sprint evidence

Date: 2026-08-12
Branch: `codex/tank-art-late-load-recovery`
Base: `3bd2454b7934449425901425bba625612842e631`

## Symptom and root cause

- User screenshots showed the same geometric tank fallback in the active-turn preview and battlefield; a subsequent hard reset restored authored models.
- Production reproduction delayed only `https://suadtl.github.io/singedTerra/art/tank-parts.webp` by 5.5 seconds. The preview and battlefield remained fallback after the valid response completed. A clean context loaded authored art.
- `TankPartArt` and `TankChassisArt` call terminal `fail()` at 5,000 ms; `onload` ignores any state other than `loading`. Preview retries only while `loading`, and battlefield idle rendering stops after failure. This is the confirmed shared cause.

## SMARTS decision

Selected: recoverable timeout plus event-driven repaint. It is Specific and Measurable through late-decode state transitions and exactly bounded repaint signals; Relevant and Satisfying because authored models recover without player intervention; Reliable and Securable because malformed/error paths remain terminal; Available and Maintainable without dependencies or asset changes; Testable at painter, consumer, real-browser, and production layers. Raising the timeout merely moves the threshold. Removing it can spin idle rendering indefinitely. Confidence: high. Intent: direct production report and causal reproduction under the standing improvement goal.

## TDD and delivery ledger

- Focused baseline: 32 tests passed across tank part/chassis, preview, and renderer settlement suites.
- RED: 22 passed, 2 failed in the focused painter suites. Both failures showed the current timeout produced terminal `failed` instead of expected recoverable `timed_out` (`TankPartArt.test.ts:423`, `TankChassisArt.test.ts:295`).
- Painter GREEN: 26/26 focused tests passed after introducing recoverable timeout state and one-shot readiness notifications.
- Consumer RED: `TankRenderer` did not forward painter readiness; the new invalidation test failed with 0 of 2 expected signals. Preview assertions were strengthened to require one current subscription and zero after clear.
- Consumer GREEN: 44/44 focused painter, preview, TankRenderer, and Renderer tests passed; client TypeScript passed.
- Initial browser proof: a production build with only `tank-parts.webp` held beyond 5 seconds showed fallback first, then changed the live tactical portrait after release without navigation or reload (Playwright desktop-fine, 1/1 passed).
- Mutation proof: changing the atlas `onload` guard to reject `timed_out` made both late-decode and notification tests fail; the production guard was restored.
- Initial full client suite: 158 files, 1,482 tests passed. Coverage: 92.92% statements, 84.75% branches, 89.73% functions, 95.25% lines.
- Full Edge suite: 352 passed, 0 failed. Dependency audit: 0 vulnerabilities.
- Repository `npm run check`: passed, including migration/security prechecks and all deterministic engine checks. The Windows worktree initially checked out unchanged migration 016 as CRLF, which broke a mutation fixture's LF-only replacement; normalizing only that unchanged working-copy file to its indexed LF bytes restored the passing precheck and produced no migration diff.
- Initial full production-bundle browser matrix: 293 passed, 31 intentional skips across desktop-fine, Pixel 5 landscape touch, and small-window projects.

## Adversarial review resolution

- The required adversarial reviewer verified staged digest `155d594376c7992dfb1cb70176747abb296bd22b` against the recorded base and returned BLOCK: one High preview-listener retention defect plus two merge-blocking Medium proof gaps.
- HIGH resolved test-first: repeated replacement of timed-out lobby previews first reproduced two retained listeners where only the current preview should remain. Preview subscriptions now retain canvases weakly, prune detached or collected canvases on the next paint, unsubscribe on clear, and never close over a detached canvas strongly.
- MEDIUM renderer proof resolved: the invalidation assertion now requires exactly one animation wake. Removing the consume step reproduces a persistent animation failure; the production consume step was restored.
- MEDIUM browser proof resolved: the delayed-atlas journey now captures both the tactical portrait and a deterministic battlefield tank strip before release, then independently requires the portrait serialization and more than 180 battlefield pixels to change after the same late decode without reload.
- Focused reviewer-fix suite: 10/10 passed; client TypeScript passed. The strengthened delayed-atlas browser journey passed 1/1.
- A concurrent browser run was explicitly excluded after its shared preview server began returning unrelated 404s. The first clean serial matrix then had one existing pixel-touch mobility-signature timing failure; that exact case passed alone. A fresh full serial matrix passed with 293 passed and 31 intentional skips across all three projects.
- First re-review returned BLOCK with one High lifecycle finding: pruning every disconnected canvas incorrectly removed valid previews while the lobby assembled a detached subtree.
- The High finding was reproduced first: three previews painted into one detached subtree retained only one of three readiness listeners. Subscriptions now distinguish canvases observed connected from those pending synchronous attachment, and a microtask retains newly connected previews while removing never-attached ones. The new regression proves all three connected previews repaint exactly once; the prior repeated-replacement test still proves stale previews are pruned.
- Final focused lifecycle suite: 46/46 passed; client TypeScript passed. The causal delayed-atlas browser journey passed 1/1.
- Final client coverage run: 158 files and 1,484 tests passed; 92.90% statements, 84.68% branches, 89.76% functions, and 95.23% lines.
- Final full production-bundle browser matrix after the lifecycle correction: 293 passed and 31 intentional skips.
- Final repository `npm run check`: passed. The unchanged migration-016 working copy was temporarily normalized to its indexed LF content for the mutation fixture, restored immediately afterward, and remains absent from the slice diff.
- Final adversarial re-review: PASS on staged digest `2c3a3f74085b2e9c6fa8373d73a05fdb37ec2a5702163a0551a382dabd90b5a9`; no Critical, High, or merge-blocking findings remained.
- The PR-path coverage audit subsequently returned BLOCK on two material proof gaps: real painter unsubscription was trusted through a preview mock, and terminal hard failures were not challenged with a later valid decode.
- Coverage gaps resolved without production changes: both real painters now prove an unsubscribed listener remains silent through timeout and valid late decode. Network/decode error, invalid dimensions, missing canvas context, and persistent target draw failures now receive a valid late `onload` and prove state remains `failed`, listeners remain silent, and authored drawing remains unavailable.
- Mutation proof: replacing both real unsubscribe functions with no-ops caused exactly the two new unsubscribe tests to fail. Allowing `failed` to pass the image-load guard caused eight terminality assertions to fail. Both mutations were restored; focused painter tests passed 28/28.
- Post-coverage full client run: 158 files and 1,486 tests passed; 92.95% statements, 84.73% branches, 89.94% functions, and 95.23% lines.
- Final coverage re-review: PASS on full PR digest `379effba76a743e81876720d9d25fe3a51732e243229a3fcc4db32b73435d874`; no merge-blocking coverage gap remained.
- Hosted CI, deployment, and production entries pending.

# Tank Art Late-Load Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and execute each task against the isolated worktree.

**Goal:** Recover authored tank models after a valid image decode arrives beyond the fallback timeout, without a reload or perpetual idle rendering.

**Architecture:** Extend both tank image painters with a recoverable timed-out state and one-shot ready notification. Preview canvases subscribe while displaying fallback; `Renderer` consumes a notification as one bounded animation frame so the next state tick repaints the battlefield.

**Tech Stack:** TypeScript, Canvas 2D, Vitest/jsdom, Playwright Chromium, Vite production bundle.

## Global constraints

- Keep the five-second battery-protection settlement deadline.
- Hard image/dimension/canvas/draw failures remain terminal.
- No dependencies, gameplay state, simulation, model geometry, or asset changes.
- All production code follows causal RED before GREEN.

### Task 1: Recoverable painter state

**Files:**
- Modify/test `client/src/renderer/TankPartArt.ts` and `TankPartArt.test.ts`.
- Modify/test `client/src/renderer/TankChassisArt.ts` and `TankChassisArt.test.ts`.

1. Replace each existing timeout test with a causal expectation that timeout settles fallback but a valid late decode reaches `ready`, notifies once, and can paint.
2. Run the focused tests and capture the expected failure against the current permanent `failed` behavior.
3. Add a `timed_out` state and one-shot ready-listener API; accept valid `onload` from `loading` or `timed_out`; preserve terminal hard failures.
4. Rerun focused tests and mutation probes that restore ignore-late-decode behavior.

### Task 2: Consumer repaint wiring

**Files:**
- Modify/test `client/src/renderer/TankLoadoutPreview.ts` and `TankLoadoutPreview.test.ts`.
- Modify/test `client/src/renderer/TankRenderer.ts`, `Renderer.ts`, and `Renderer.tankChassis.test.ts`.

1. Add RED tests proving preview fallback repaints once on late readiness and battlefield animation wakes exactly until one repaint consumes invalidation.
2. Replace preview polling with a readiness subscription guarded by connection/signature identity.
3. Route painter readiness through `TankRenderer` into a renderer-owned one-frame invalidation flag consumed by `render()`.
4. Rerun focused tests and kill callback removal, duplicate notification, signature-guard, and invalidation-consumption mutations.

### Task 3: Browser proof and delivery

**Files:**
- Modify/test `e2e/verified-deployment.spec.ts` or create a focused tank-art recovery spec.
- Append `.codearbiter/reports/2026-08-12-tank-art-late-load-recovery-sprint-evidence.md`.

1. Add a real-browser test delaying only `tank-parts.webp` beyond five seconds and assert authored preview plus battlefield recovery without reload.
2. Run focused, client, browser, check, build, coverage, audit, and diff gates.
3. Stage the exact bounded diff and give one adversarial reviewer this spec, plan, sprint log, tests, and final diff; resolve every Critical, High, and merge blocker.
4. Commit through CodeArbiter, push PR, require green CI on the exact reviewed head, merge, deploy, and repeat the delayed-asset proof against production.

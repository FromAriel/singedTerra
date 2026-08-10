# Pre-game operations overlays Implementation Plan

**Goal:** Turn account/record and Advanced Settings into one coherent, non-reflowing pre-game overlay system while preserving account, setting, and match behavior.

**Architecture:** A small `LobbyOverlayView` owns backdrop, modal semantics, Escape/Tab behavior, and focusable-surface structure. `Lobby` owns the one active overlay state and renders it as a sibling above the assembled lobby card, so it cannot participate in the mission grid. `AccountPanelView` retains the compact masthead trigger and exposes existing account content for the overlay; route views retain their own controls while using one Advanced Settings trigger. Existing raw settings state stays owned by `Lobby`; the overlay only re-homes its DOM controls.

**Tech stack:** TypeScript DOM UI, scoped lobby CSS, Vitest, production-bundle Playwright.

## Global constraints

- Client presentation only. Do not change AccountSession, Supabase/Auth calls, credentials, persistence, backend functions, migrations, dependencies, game rules, setting parsing, or transport contracts.
- Read `security-controls.md` before touching account composition; preserve its password/session and progression boundaries verbatim in behavior.
- Preserve every current settings field, raw value, event listener, validation constraint, hint, and serialization result.
- Do not read or modify `.codearbiter/sprint-log.md` because of the sanctioned malformed UTF-8 marker-root exception.

## Task 1: Define and prove the shared overlay primitive (TDD)

**Files:**
- Create: `client/src/ui/LobbyOverlayView.ts`
- Create: `client/src/ui/LobbyOverlayView.test.ts`

1. Write failing DOM tests for a labelled modal dialog with `aria-modal`, a backdrop that invokes close, a visible Close action, Escape close, and cyclic Tab/Shift+Tab focus across enabled controls.
2. Run `npm -w @singedterra/client run test -- LobbyOverlayView.test.ts` and record the expected missing-module failure.
3. Implement the minimal pure builder. It receives title/kicker/body/onClose and owns only modal keyboard/backdrop mechanics; it owns no Lobby state or auth/settings callback.
4. Rerun the focused test green.

## Task 2: Separate the compact account trigger from the modal account content (TDD)

**Files:**
- Modify: `client/src/ui/AccountPanelView.ts`
- Modify: `client/src/ui/AccountPanelView.test.ts`
- Modify: `client/src/ui/Lobby.account.test.ts`

1. Write failing tests that distinguish the masthead Player Record/Account trigger from its overlay content, while preserving authenticated record values, anonymous form semantics, autocomplete, immediate password clearing, errors-as-text, submit, and sign-out callbacks.
2. Run the focused account tests red.
3. Refactor only DOM composition: keep the trigger compact and expose the pre-existing account detail/form content for the shared overlay. Do not alter AccountSession interactions or credentials objects.
4. In `Lobby`, render the account overlay as a root sibling only when active, close it through the shared overlay, and restore focus to the trigger after the re-render.
5. Rerun focused account tests green.

## Task 3: Move Local and Online Advanced Settings into one operations overlay (TDD)

**Files:**
- Modify: `client/src/ui/Lobby.ts`
- Modify: `client/src/ui/LobbyHotSeatView.ts`
- Modify: `client/src/ui/LobbyCreateView.ts`
- Modify: their existing focused tests

1. Write failing route tests for an Advanced Settings button in Local Battery and Open Operation, one active overlay at a time, and existing settings values/callbacks surviving open, edit, close, and re-open.
2. Run the focused route tests red.
3. Replace each in-flow `<details>` disclosure with a common trigger. Keep field builders and their raw backing state in `Lobby`; render their existing local/online field sets only inside the active Operations Settings modal.
4. Make account and Advanced Settings mutually exclusive and return focus to the exact opening trigger after close.
5. Treat Open Operation as one command sequence rather than two competing columns: keep every visible Command Vehicle and Operation Profile control inside its owning section at desktop, touch, and compact widths.
6. Rerun focused route tests green.

## Task 4: Add causal overlay geometry and aligned form styling (TDD)

**Files:**
- Modify: `client/src/ui/Lobby.ts`
- Modify: `e2e/lobby-layout.spec.ts`
- Modify: affected advanced-settings browser specs

1. Add failing production-bundle browser tests at desktop, touch, and compact sizes. Capture the masthead, route, preview, and controls geometry before open; assert their rectangles do not move when either overlay opens. Assert dialog/backdrop stack above the lobby and Advanced Settings fields have aligned label/control/hint columns (or a deliberate compact single-column layout).
2. Add keyboard assertions for Escape and focus restoration and ensure backdrop close works without activating the background.
3. Implement scoped squared command-overlay styling: fixed full-stage backdrop, centred constrained surface, visible scroll containment, no rounded-card treatment, clear modal hierarchy, and grid-based operations sections.
4. Run the targeted browser contract green.
5. Temporarily mutate the overlay root to document-flow positioning, rebuild the controlled production bundle, and show the geometry test fail. Revert that mutation before all final gates.

## Task 5: Verify, adversarially review, and deliver

1. Run focused tests, `npm run test:client`, `npm run check`, `npm run check:edge`, `npm run audit:deps`, `npm run build`, `git diff --check`, and the isolated production-bundle non-live Playwright matrix.
2. Stage only this spec/plan, overlay/account/route source/tests, CSS host, and browser tests; run the canonical changed-file secrets scan.
3. Give one adversarial reviewer the exact staged diff plus this spec, plan, final test logs, mutation evidence, and an explicit note not to read the malformed sprint log. Resolve every Critical, High, and merge-blocking finding; rerun exact-final-diff review after any correction.
4. Run the commit gate in the ordinary clone, open the PR, require exact-head hosted CI green, merge with a head guard, verify Pages deployment provenance and public HTTP health, then record the delivery receipt under the docs lane.

## Plan self-review

The plan isolates shared overlay behavior first, then preserves account semantics, then moves both route settings paths, then proves visual causality. It deliberately excludes every auth/backend/settings-contract and gameplay change, while retaining the required adversarial exact-diff and hosted-production delivery gates.

# Shareable Room Invites Implementation Plan

**Goal:** Let a host copy one safe invite URL and let an invited player arrive
at a prefilled Join Room screen without changing backend behavior.

## Task 1: Pin the invite contract

- [x] Add failing pure URL-helper tests for normalization, deployment-path
  preservation, query/hash stripping, and invalid invite rejection.
- [x] Add failing Lobby oracles for initial routing, exact clipboard payload,
  accessible success, and clipboard rejection.
- [x] Add a failing production-browser oracle for URL-to-prefilled-join routing.

## Task 2: Implement the smallest complete flow

- [x] Add the validated invite URL helper.
- [x] Route valid construction-time invites to Online / Join Room.
- [x] Add the waiting-room copy action and non-modal status/error feedback.
- [x] Style the invite action through the lobby's existing semantic button and
  focus vocabulary.

## Task 3: Review, verify, and deliver

- [x] Resolve all Critical, High, Important, accessibility, security, and
  coverage findings.
- [x] Run focused tests, deterministic checks, client coverage, Edge tests,
  production build, full E2E, runtime audit, diff hygiene, and secret scan.
- [x] Commit through the governed gate.
- [x] Open a ready stacked PR against `codex/single-screen-combat-shell`.
- [ ] Prove exact-head hosted CI and CodeQL green; do not merge or deploy.

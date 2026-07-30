# Authored Tank Chassis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace living tanks' geometric chassis with cached, tintable authored
art without changing gameplay geometry or stable-frame behavior.

**Architecture:** `TankChassisArt` loads one transparent neutral WebP and lazily
creates a cached colored canvas for each player color. `TankRenderer` keeps
ground glow, contact shadow, shared barrel geometry, damage, active, burial,
recoil, and wreck layers, substituting authored art only for the live
body/turret/tread block. `Renderer` holds the idle loop until the first usable
chassis frame is painted.

**Tech Stack:** TypeScript, Canvas 2D, Vite public assets, Vitest, Playwright,
built-in image generation, local ffmpeg WebP encoding.

## Global Constraints

- Client presentation only; do not change `shared/`, Supabase, action logs,
  collision, physics, tank state, barrel geometry, gameplay coordinates, or
  page layout.
- Final asset: `client/public/art/tank-chassis.webp`, exactly 256 by 128,
  transparent outside the silhouette, and at most 100,000 bytes.
- Tint variants are cached by player color; no per-frame offscreen allocation.
- Existing procedural live chassis remains the loading/error fallback.
- No repository dependency or lockfile change; no merge or deployment.

---

### Task 1: Generate and bound the chassis asset

**Files:**
- Create: `client/public/art/tank-chassis.webp`
- Create: `e2e/tank-chassis.spec.ts`

- [x] **Step 1: Write the failing asset contract**

  Request and decode the asset. Assert WebP MIME, transfer cap, exact 256 by 128
  dimensions, meaningful transparent area, enough opaque silhouette pixels,
  luminance range, bounded occupied edges, and a visible gameplay width no
  wider than the established procedural tread footprint.

- [x] **Step 2: Run the asset contract RED**

  Expected: FAIL because the asset path is absent.

- [x] **Step 3: Generate, inspect, and optimize**

  Generate one grayscale side-view armored chassis on transparency with no
  barrel or environmental content. Crop/scale to the required frame, encode
  WebP with alpha, and inspect both full-size and 36 by 24 gameplay previews.

- [x] **Step 4: Run the asset contract GREEN**

  Re-run at root and `VITE_BASE=/singedTerra/`.

---

### Task 2: Add the fail-safe tint cache

**Files:**
- Create: `client/src/renderer/TankChassisArt.ts`
- Create: `client/src/renderer/TankChassisArt.test.ts`

- [x] **Step 1: Write loader and tint-cache tests**

  Prove one image, handler ordering, base URL, exact dimension validation,
  bounded timeout, late-callback rejection, loading/error fallback, one cached
  canvas per color, multiply then alpha-mask composition, anchor coordinates,
  and first-painted settlement.

- [x] **Step 2: Run RED**

  Expected: FAIL because `TankChassisArt.ts` does not exist.

- [x] **Step 3: Implement the minimal cache**

  Load once, fail closed, create tint variants only on first use, preserve
  authored luminance/transparency, draw at 36 by 24, and acknowledge the first
  successful target draw.

- [x] **Step 4: Run focused GREEN**

  Run the loader/cache suite and workspace typecheck.

---

### Task 3: Integrate authored art without moving gameplay geometry

**Files:**
- Modify: `client/src/renderer/TankRenderer.ts`
- Modify: `client/src/renderer/Renderer.ts`
- Create: `client/src/renderer/TankRenderer.chassis.test.ts`
- Create: `client/src/renderer/Renderer.tankChassis.test.ts`

- [x] **Step 1: Write integration tests**

  Pin authored-vs-fallback chassis substitution, exact shared barrel endpoint,
  active/damage layer survival, wreck isolation, recoil containment, and idle
  settlement including a no-living-tank scene.

- [x] **Step 2: Run RED**

  Expected: FAIL because `TankRenderer` has no chassis-art seam.

- [x] **Step 3: Integrate the chassis**

  Extract the existing procedural live chassis as fallback, place the authored
  draw at named dimensions/anchor, retain all structural overlays, and expose
  only the settlement signal required by `Renderer`.

- [x] **Step 4: Run focused GREEN**

  Run chassis integration plus existing wreck, recoil, muzzle, and renderer
  lifecycle tests.

---

### Task 4: Visual QA, review, and governed delivery

**Files:**
- Modify: `.codearbiter/sprint-log.md`
- Modify: `.codearbiter/plans/authored-tank-chassis.md`

- [x] **Step 1: Browser visual QA**

  Inspect red/right-facing and blue/left-facing tanks before and after a shot,
  at desktop, touch landscape, and small-window scales. Confirm silhouettes,
  aim, anchoring, terrain contact, player identity, and no scrolling.

- [x] **Step 2: Run adversarial review**

  Review art quality, transparency, tint identity, geometry parity, fallback,
  loader lifecycle, cache reuse, base paths, and performance.

- [x] **Step 3: Run the complete local gate**

  Run deterministic, client coverage, Edge, production build, full E2E, audit,
  diff hygiene, conflict-marker, and changed-file secret checks.

- [x] **Step 4: Governed commit and ready stacked PR**

  Commit through codeArbiter, push, and open against
  `codex/authored-terrain-material`. Do not merge or deploy.

- [ ] **Step 5: Exact-head hosted proof**

  Require CI, Edge, rendering E2E, CodeQL workflow, and repository CodeQL on
  the final governance receipt head. Supabase Preview may skip.

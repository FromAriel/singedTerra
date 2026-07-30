# Authored Terrain Material Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subtle authored rock grain to the cached destructible terrain
without changing gameplay or stable-frame cost.

**Architecture:** A small `TerrainMaterial` loader decodes one square WebP into
a reusable signed luminance field. `TerrainRenderer` samples that field only
inside its existing terrain-version rebuild and acknowledges the first applied
material frame. The authoritative terrain bitmap, alpha coverage, strata,
rim, bevel lighting, and per-frame cached blit remain unchanged.

**Tech Stack:** TypeScript, Canvas 2D, Vite public assets, Vitest, Playwright,
built-in image generation, local ffmpeg WebP encoding.

## Global Constraints

- Client presentation only; do not change `shared/`, Supabase, action logs,
  physics, terrain bytes, gameplay coordinates, or layout.
- Final asset: `client/public/art/terrain-material.webp`, exactly 256 by 256,
  at most 100,000 bytes, visually opaque, and free of large directional forms.
- Material work occurs only on terrain cache rebuild, never on a stable frame.
- Existing terrain rendering remains the complete loading/error fallback.
- No repository dependency or lockfile change; no merge or deployment.

---

### Task 1: Generate and bound the material asset

**Files:**
- Create: `client/public/art/terrain-material.webp`
- Create: `e2e/terrain-material.spec.ts`

**Interfaces:**
- Produces: base-relative public asset `art/terrain-material.webp`.
- Consumes: no production code.

- [x] **Step 1: Write the failing asset contract**

  Request the asset, assert WebP MIME and the 100,000-byte transfer cap, decode
  it, and assert exact 256 by 256 dimensions, sampled alpha 255, and bounded
  non-flat luminance variation.

- [x] **Step 2: Run the asset contract RED**

  Run the focused Playwright check. Expected: FAIL because the path is absent.

- [x] **Step 3: Generate and optimize**

  Generate a seamless neutral scorched-rock grain with no large cracks,
  craters, objects, text, directional lighting, or foreground silhouette.
  Inspect it, resize to 256 by 256, encode opaque WebP, and verify the contract.

- [x] **Step 4: Run the asset contract GREEN**

  Re-run the focused Playwright check at root and `VITE_BASE=/singedTerra/`.

---

### Task 2: Add the fail-safe luminance sampler

**Files:**
- Create: `client/src/renderer/TerrainMaterial.ts`
- Create: `client/src/renderer/TerrainMaterial.test.ts`

**Interfaces:**
- Produces:
  - `type TerrainMaterialState = 'loading' | 'ready' | 'failed'`
  - `class TerrainMaterial`
  - `get state()`, `get isSettled()`, `get needsApplication()`
  - `sample(x, y): number`
  - `acknowledgeApplied(): void`
- Consumes: one injected image factory, one injected canvas factory, and Vite
  `BASE_URL`.

- [x] **Step 1: Write loader and wrapping tests**

  Prove one image/decode surface, handler-before-src ordering, exact square
  validation, base-aware URL, deterministic 256-pixel wrapping, signed bounded
  luminance, pending application, acknowledgement, and fail-closed output.

- [x] **Step 2: Run loader tests RED**

  Expected: FAIL because `TerrainMaterial.ts` does not exist.

- [x] **Step 3: Implement the minimal sampler**

  Decode once, derive one signed luminance byte per texel, wrap coordinates by
  the power-of-two mask, and return zero while loading or failed.

- [x] **Step 4: Run loader tests GREEN**

  Expected: PASS with a bounded load deadline, no lingering timer after
  settlement, and no per-sample allocation.

---

### Task 3: Apply material inside the terrain dirty rebuild

**Files:**
- Modify: `client/src/renderer/TerrainRenderer.ts`
- Modify: `client/src/renderer/Renderer.ts`
- Create: `client/src/renderer/TerrainRenderer.material.test.ts`
- Create: `client/src/renderer/Renderer.terrainMaterial.test.ts`

**Interfaces:**
- Consumes: `TerrainMaterial.sample()`, `needsApplication`, `isSettled`, and
  `acknowledgeApplied()`.
- Produces: materialized RGB during terrain rebuild and idle eligibility until
  the first ready texture application.

- [x] **Step 1: Write terrain integration tests**

  Pin unchanged terrain bytes, alpha, lit rim, bevel direction, bounded RGB
  modulation, stable-version cache reuse, and one rebuild when material becomes
  ready after a fallback render.

- [x] **Step 2: Run terrain tests RED**

  Expected: FAIL because `TerrainRenderer` does not consume a material sampler.

- [x] **Step 3: Integrate the material**

  Apply a named bounded luminance factor after strata and before/without
  disturbing structural lighting, acknowledge only a successful rebuild, and
  include material settlement in renderer animation eligibility.

- [x] **Step 4: Run focused GREEN**

  Run material loader, terrain material, existing edge/bevel, and renderer
  eligibility tests.

---

### Task 4: Visual QA, review, and governed delivery

**Files:**
- Modify: `.codearbiter/sprint-log.md`
- Modify: `.codearbiter/plans/authored-terrain-material.md`

- [x] **Step 1: Browser visual QA**

  Inspect intact slopes, a fresh crater, deep strata, tank silhouettes, fire,
  and compact HUD profiles. Confirm no scroll and no collision-like fake forms.

- [x] **Step 2: Run adversarial review**

  Review asset quality, seam visibility, contrast, loader lifecycle, cache
  invalidation, alpha/terrain preservation, base path, and performance.

- [x] **Step 3: Run the complete local gate**

  Run deterministic, client coverage, Edge, production build, full E2E, audit,
  diff hygiene, conflict-marker, and changed-file secret checks.

- [ ] **Step 4: Governed commit and ready stacked PR**

  Commit through codeArbiter, push, and open against
  `codex/authored-battlefield-backdrop`. Do not merge or deploy.

- [ ] **Step 5: Exact-head hosted proof**

  Require CI, Edge, rendering E2E, CodeQL workflow, and repository CodeQL on
  the final governance receipt head. Supabase Preview may skip.

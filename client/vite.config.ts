/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Public base path. Defaults to '/' (local dev + root-hosted static). GitHub Pages
// serves a PROJECT site under /<repo>/, so the deploy workflow sets VITE_BASE to
// "/<repo>/" — Vite then prefixes every emitted asset URL with it. Any static host
// at the domain root works with the '/' default.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    outDir: 'dist',
    // Slice 3 makes all user-facing modes first-class build entries. The default
    // page presents the mode launcher; Classic remains underneath it, Apocalypse
    // is the live sandbox, and Arsenal Lab is the registry/content inspector.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        apocalypse: resolve(__dirname, 'apocalypse.html'),
        arsenal: resolve(__dirname, 'arsenal.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/main.ts',
        'src/ui/ModeLauncher.ts',
        'src/lab/main.ts',
        'src/apocalypse/main.ts',
        'src/apocalypse/main-slice3.ts',
        'src/apocalypse/ApocalypseOverlay.ts',
        'src/apocalypse/ComposedOverlay.ts',
        'src/lib/SupabaseTypes.ts',
        'src/client/GameClient.ts',
        'src/audio/AudioEngine.ts',
        'src/renderer/Renderer.ts',
        'src/renderer/EffectsRenderer.ts',
        'src/renderer/TerrainRenderer.ts',
        'src/renderer/TankRenderer.ts',
        'src/renderer/ProjectileRenderer.ts',
        'src/renderer/HUDRenderer.ts',
        'src/renderer/explosionFx.ts',
        'src/renderer/tankFx.ts',
      ],
    },
  },
});

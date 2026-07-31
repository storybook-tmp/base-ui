import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/cli.ts',
      formats: ['es'],
      fileName: () => 'cli.js',
    },
    rollupOptions: {
      // Bundle all npm dependencies so the published package is self-contained:
      // consumers extract the tarball and run dist/cli.js without an install step.
      external: [/^node:/],
      output: {
        banner: '#!/usr/bin/env node',
        // Keep everything in a single dist/cli.js even when a dependency is
        // loaded through a dynamic import.
        inlineDynamicImports: true,
      },
    },
  },
});

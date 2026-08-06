import { defineConfig } from 'vite-plus';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [tanstackRouter(), tailwindcss()],

  fmt: {
    semi: true,
    singleQuote: true,
    // Patterns are resolved from this file's directory (oxfmt schema: "based on the
    // location of the Oxfmt configuration file"). `**/*.md` requires depth ≥ 1, so
    // root-level .md/.json files (e.g. web/README.md) need a separate `*.md` / `*.json`.
    // Files outside web/ (e.g. repo-root README.md, docs/, server/) are out of scope
    // for this web/-local config; run `vp check` from web/ to avoid scanning them.
    ignorePatterns: ['src/routeTree.gen.ts', '*.md', '*.json', '**/*.md', '**/*.json'],
  },

  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ['src/routeTree.gen.ts'],
  },

  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

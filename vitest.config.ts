/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@editor': path.resolve(__dirname, './src/editor'),
      '@game': path.resolve(__dirname, './src/game'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
    // Watch mode configuration (only enabled via --watch flag)
    watchExclude: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    // Only rerun tests affected by changes
    forceRerunTriggers: ['**/vitest.config.ts', '**/src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/public/**',
      ],
    },
    // Enable UI mode for better debugging (disabled by default, use yarn test:ui to enable)
    ui: false,
    // Reporter configuration
    reporter: ['verbose', 'html'],
    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
    // Mock configuration
    server: {
      deps: {
        inline: ['@testing-library/user-event'],
      },
    },
  },
});

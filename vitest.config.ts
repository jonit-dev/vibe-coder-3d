/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache'],
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
    // Enable UI mode for better debugging
    ui: true,
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

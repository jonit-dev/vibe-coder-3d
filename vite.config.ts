import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { sceneApiMiddleware } from './src/plugins/vite-plugin-scene-api';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths(), sceneApiMiddleware()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@game': path.resolve(__dirname, './src/game'),
      '@editor': path.resolve(__dirname, './src/editor'),
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    watch: {
      ignored: ['**/scenes/*.tsx', '**/scenes/*.json'],
    },
  },
});

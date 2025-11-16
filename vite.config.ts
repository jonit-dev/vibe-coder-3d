import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { sceneApiMiddleware } from './src/plugins/vite-plugin-scene-api';
import { vitePluginScriptAPI } from './src/plugins/vite-plugin-script-api';
import { vitePluginModelIngest } from './src/plugins/vite-plugin-model-ingest';
import { createAssetsApi } from './src/plugins/assets-api/createAssetsApi';
import { aiApiPlugin } from './src/plugins/vite-plugin-ai-api';
import { saveLogPlugin } from './src/plugins/saveLogPlugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
    sceneApiMiddleware(),
    vitePluginScriptAPI(),
    vitePluginModelIngest(),
    createAssetsApi({
      libraryRoot: 'src/game/assets',
      scenesRoot: 'src/game/scenes',
    }),
    aiApiPlugin(),
    saveLogPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@game': path.resolve(__dirname, './src/game'),
      '@editor': path.resolve(__dirname, './src/editor'),
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.mp3', '**/*.wav', '**/*.jpg', '**/*.png'],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  server: {
    watch: {
      // Ignore scenes, scripts, and assets since they have their own hot-reload mechanisms
      ignored: [
        '**/scenes/**/*.tsx',
        '**/scenes/**/*.json',
        '**/scripts/**/*.ts',
        '**/game/scripts/**',
        '**/assets/**/*.material.tsx',
        '**/assets/**/*.prefab.tsx',
        '**/assets/**/*.input.tsx',
        '**/assets/**/*.script.tsx',
        '**/public/assets/models/**',
        '**/rust/**',
      ],
    },
    fs: {
      allow: ['..'],
    },
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});

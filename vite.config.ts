import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const { sceneApiMiddleware } = await import('./src/plugins/vite-plugin-scene-api');
  return {
    plugins: [tailwindcss(), react(), tsconfigPaths(), sceneApiMiddleware()],
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
        ignored: ['**/scenes/*.tsx', '**/scenes/*.json'],
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
  };
});

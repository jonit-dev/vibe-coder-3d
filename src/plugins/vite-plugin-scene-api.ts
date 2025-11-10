import type { Plugin } from 'vite';
import { FsSceneStore } from '../core/lib/serialization/common/FsSceneStore';
import { createSceneApi } from './scene-api/createSceneApi';
import { JsonFormatHandler } from './scene-api/formats/JsonFormatHandler';
import { TsxFormatHandler } from './scene-api/formats/TsxFormatHandler';
import * as fs from 'fs';
import * as path from 'path';

const SCENES_DIR = './src/game/scenes';
const GEOMETRY_DIR = './src/game/geometry';

/**
 * Vite plugin to handle scene persistence via HTTP API
 * Refactored to use the modular scene API architecture
 *
 * Provides endpoints:
 * - POST /api/scene/json/save - Save scene as JSON
 * - GET /api/scene/json/load?name=... - Load scene from JSON
 * - GET /api/scene/json/list - List JSON scenes
 * - POST /api/scene/tsx/save - Save scene as TSX
 * - GET /api/scene/tsx/load?name=... - Load scene from TSX
 * - GET /api/scene/tsx/list - List TSX scenes
 *
 * Backward compatibility routes:
 * - POST /api/scene/save -> /api/scene/json/save
 * - GET /api/scene/load -> /api/scene/json/load
 * - GET /api/scene/list -> /api/scene/json/list
 * - POST /api/scene/save-tsx -> /api/scene/tsx/save
 * - GET /api/scene/load-tsx -> /api/scene/tsx/load
 * - GET /api/scene/list-tsx -> /api/scene/tsx/list
 */
export function sceneApiMiddleware(): Plugin {
  const store = new FsSceneStore(SCENES_DIR);
  const jsonHandler = new JsonFormatHandler(store);
  const tsxHandler = new TsxFormatHandler(store, SCENES_DIR);

  // Create the new API plugin
  const apiPlugin = createSceneApi({
    scenesDir: SCENES_DIR,
    handlers: [jsonHandler, tsxHandler],
    maxRequestSize: 10_000_000, // 10MB for scenes
    corsOrigin: '*',
  });

  // Return a combined plugin that includes backward compatibility
  return {
    name: 'scene-api',
    configureServer: (server) => {
      // FIRST: Add backward compatibility middleware to rewrite URLs
      server.middlewares.use('/api/scene', (req, _res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Map old routes to new routes
        // Note: req.url is relative to the mount point, so '/save' not '/api/scene/save'
        const routeMap: Record<string, string> = {
          '/save': '/json/save',
          '/load': '/json/load',
          '/list': '/json/list',
          '/save-tsx': '/tsx/save',
          '/load-tsx': '/tsx/load',
          '/list-tsx': '/tsx/list',
        };

        const newPath = routeMap[pathname];

        if (newPath) {
          // Rewrite the URL to the new format
          req.url = newPath + url.search;
        }

        // Continue to next middleware
        next();
      });

      // THEN: Set up the new API routes
      if (typeof apiPlugin.configureServer === 'function') {
        apiPlugin.configureServer(server);
      } else if (apiPlugin.configureServer?.handler) {
        apiPlugin.configureServer.handler(server);
      }

      // ADD: Geometry save endpoint
      server.middlewares.use('/api/save-geometry', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          // Read request body
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            const { filepath, content } = JSON.parse(body);

            // Normalize path - remove leading slash and ensure it's in geometry dir
            const normalizedPath = filepath.startsWith('/src/game/geometry/')
              ? filepath.slice(1) // Remove leading /
              : filepath.startsWith('src/game/geometry/')
                ? filepath
                : `src/game/geometry/${filepath}`;

            const fullPath = path.join(process.cwd(), normalizedPath);

            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            // Write file
            fs.writeFileSync(fullPath, content, 'utf-8');

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: fullPath }));
          });
        } catch (error) {
          console.error('Geometry save error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to save geometry' }));
        }
      });
    },
  };
}

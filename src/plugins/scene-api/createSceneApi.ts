import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { FsSceneStore } from '../../core/lib/serialization/common/FsSceneStore';
import { applyCors, readJsonBody, sendJson, sendError } from '../../core/lib/serialization/common/HttpUtils';
import { Logger } from '../../core/lib/logger';
import type { ISceneFormatHandler } from './ISceneFormatHandler';

const logger = Logger.create('SceneApi');

/**
 * Configuration options for the Scene API
 */
export interface ISceneApiOptions {
  /**
   * Directory where scenes are stored
   */
  scenesDir: string;

  /**
   * Format handlers (JSON, TSX, stream, etc.)
   */
  handlers: ISceneFormatHandler[];

  /**
   * Maximum request size in bytes (default: 5MB)
   */
  maxRequestSize?: number;

  /**
   * CORS origin (default: '*')
   */
  corsOrigin?: string;

  /**
   * Optional authentication hook
   */
  auth?: (req: IncomingMessage) => Promise<boolean> | boolean;
}

/**
 * Create a Vite plugin that provides scene API endpoints
 * Provides unified routes: /api/scene/:format/:action
 *
 * Routes:
 * - POST /api/scene/:format/save - Save a scene
 * - GET /api/scene/:format/load?name=... - Load a scene
 * - GET /api/scene/:format/list - List scenes
 *
 * @param options - Configuration options
 * @returns Vite plugin
 */
export const createSceneApi = (options: ISceneApiOptions): Plugin => ({
  name: 'scene-api',
  configureServer(server) {
    const {
      handlers,
      scenesDir,
      corsOrigin = '*',
      maxRequestSize = 5_000_000,
      auth,
    } = options;

    // Create store instance
    const store = new FsSceneStore(scenesDir);

    // Map handlers by format for quick lookup
    const handlerMap = new Map(handlers.map((h) => [h.format, h] as const));

    logger.info('Scene API initialized', {
      scenesDir,
      formats: handlers.map((h) => h.format),
    });

    server.middlewares.use('/api/scene', async (req, res) => {
      try {
        // Apply CORS headers
        applyCors(res, corsOrigin);

        // Handle OPTIONS preflight
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Check authentication if provided
        if (auth) {
          const isAuthorized = await auth(req);
          if (!isAuthorized) {
            sendError(res, 401, 'Unauthorized');
            return;
          }
        }

        // Parse URL
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // Extract format and action from path
        // When mounted at /api/scene, req.url is relative (e.g., /json/save or /tsx/save)
        // So pathParts might be ['json', 'save'] instead of ['api', 'scene', 'json', 'save']
        let format: string;
        let action: string;

        if (pathParts[0] === 'api' && pathParts[1] === 'scene') {
          // Full path: /api/scene/:format/:action
          format = pathParts[2];
          action = pathParts[3];
        } else {
          // Relative path: /:format/:action (when mounted at /api/scene)
          format = pathParts[0];
          action = pathParts[1];
        }

        // Get handler for format
        const handler = handlerMap.get(format as 'json' | 'tsx' | 'stream');
        if (!handler) {
          sendError(res, 404, `Unknown format: ${format}`);
          return;
        }

        // Route to appropriate action
        if (action === 'save' && req.method === 'POST') {
          await handleSave(req, res, handler, maxRequestSize);
        } else if (action === 'load' && req.method === 'GET') {
          await handleLoad(req, res, handler, url);
        } else if (action === 'list' && req.method === 'GET') {
          await handleList(req, res, handler);
        } else {
          sendError(res, 404, `Unknown action: ${action || 'none'}`);
        }
      } catch (error) {
        logger.error('Scene API error', { error });
        sendError(res, 500, error instanceof Error ? error.message : 'Internal server error');
      }
    });

    // Ensure scenes directory exists
    store.list().catch(() => {
      logger.warn('Scenes directory not accessible', { scenesDir });
    });
  },
});

/**
 * Handle save request
 */
async function handleSave(
  req: IncomingMessage,
  res: ServerResponse,
  handler: ISceneFormatHandler,
  maxRequestSize: number,
): Promise<void> {
  const body = await readJsonBody<
    {
      name: string;
      payload?: unknown;
      data?: unknown;
      [key: string]: unknown;
    }
  >(req, maxRequestSize);

  if (!body.name || typeof body.name !== 'string') {
    sendError(res, 400, 'Scene name is required');
    return;
  }

  const { name, payload, data, ...rest } = body;

  let scenePayload = payload ?? data;

  if (scenePayload === undefined && Object.keys(rest).length > 0) {
    scenePayload = rest;
  }

  if (scenePayload === undefined) {
    sendError(res, 400, 'Scene payload is required');
    return;
  }

  const result = await handler.save({
    name,
    payload: scenePayload,
  });

  logger.info('Scene saved', {
    format: handler.format,
    filename: result.filename,
    size: result.size,
  });

  sendJson(res, 200, {
    success: true,
    ...result,
  });
}

/**
 * Handle load request
 */
async function handleLoad(
  _req: IncomingMessage,
  res: ServerResponse,
  handler: ISceneFormatHandler,
  url: URL,
): Promise<void> {
  const name = url.searchParams.get('name');

  if (!name) {
    sendError(res, 400, 'Scene name is required');
    return;
  }

  const result = await handler.load({ name });

  logger.info('Scene loaded', {
    format: handler.format,
    filename: result.filename,
  });

  sendJson(res, 200, {
    success: true,
    ...result,
  });
}

/**
 * Handle list request
 */
async function handleList(
  _req: IncomingMessage,
  res: ServerResponse,
  handler: ISceneFormatHandler,
): Promise<void> {
  const result = await handler.list({});

  logger.debug('Scenes listed', {
    format: handler.format,
    count: result.length,
  });

  sendJson(res, 200, {
    success: true,
    scenes: result,
  });
}

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { applyCors, readJsonBody, sendJson, sendError } from '../../core/lib/serialization/common/HttpUtils';
import { Logger } from '../../core/lib/logger';
import { FsAssetStore } from './FsAssetStore';
import type { AssetType } from '../../core/lib/serialization/assets/AssetTypes';

const logger = Logger.create('AssetsApi');

/**
 * Configuration options for the Assets API
 */
export interface IAssetsApiOptions {
  /**
   * Directory where library assets are stored
   */
  libraryRoot: string;

  /**
   * Directory where scenes are stored (for scene-local assets)
   */
  scenesRoot?: string;

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
 * Create a Vite plugin that provides asset API endpoints
 * Provides routes: /api/assets/:type/:action
 *
 * Routes:
 * - POST /api/assets/:type/save - Save an asset
 * - GET /api/assets/:type/load?path=... - Load an asset
 * - GET /api/assets/:type/list?scope=library|scene&scene=... - List assets
 * - DELETE /api/assets/:type/delete?path=... - Delete an asset
 *
 * @param options - Configuration options
 * @returns Vite plugin
 */
export const createAssetsApi = (options: IAssetsApiOptions): Plugin => ({
  name: 'assets-api',
  configureServer(server) {
    const {
      libraryRoot,
      scenesRoot = 'src/game/scenes',
      corsOrigin = '*',
      maxRequestSize = 5_000_000,
      auth,
    } = options;

    // Create store instance
    const store = new FsAssetStore(libraryRoot, scenesRoot);

    logger.info('Assets API initialized', {
      libraryRoot,
      scenesRoot,
    });

    server.middlewares.use('/api/assets', async (req, res) => {
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

        // Extract asset type and action from path
        let assetType: string;
        let action: string;

        if (pathParts[0] === 'api' && pathParts[1] === 'assets') {
          // Full path: /api/assets/:type/:action
          assetType = pathParts[2];
          action = pathParts[3];
        } else {
          // Relative path: /:type/:action (when mounted at /api/assets)
          assetType = pathParts[0];
          action = pathParts[1];
        }

        // Validate asset type
        const validTypes: AssetType[] = ['material', 'prefab', 'input', 'script'];
        if (!validTypes.includes(assetType as AssetType)) {
          sendError(res, 404, `Unknown asset type: ${assetType}`);
          return;
        }

        // Route to appropriate action
        if (action === 'save' && req.method === 'POST') {
          await handleSave(req, res, store, assetType as AssetType, maxRequestSize);
        } else if (action === 'load' && req.method === 'GET') {
          await handleLoad(req, res, store, assetType as AssetType, url);
        } else if (action === 'list' && req.method === 'GET') {
          await handleList(req, res, store, assetType as AssetType, url);
        } else if (action === 'delete' && req.method === 'DELETE') {
          await handleDelete(req, res, store, assetType as AssetType, url);
        } else {
          sendError(res, 404, `Unknown action: ${action || 'none'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        if (errorMessage.includes('not found')) {
          logger.warn('Asset not found', { error: errorMessage });
          sendError(res, 404, errorMessage);
        } else {
          logger.error('Assets API error', { error });
          sendError(res, 500, errorMessage);
        }
      }
    });
  },
});

/**
 * Handle save request
 */
async function handleSave(
  req: IncomingMessage,
  res: ServerResponse,
  store: FsAssetStore,
  assetType: AssetType,
  maxRequestSize: number,
): Promise<void> {
  const body = await readJsonBody<{
    path: string;
    payload?: unknown;
    data?: unknown;
    [key: string]: unknown;
  }>(req, maxRequestSize);

  if (!body.path || typeof body.path !== 'string') {
    sendError(res, 400, 'Asset path is required');
    return;
  }

  let payload = body.payload ?? body.data;

  if (payload === undefined && body.path) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path: _p, ...rest } = body;
    if (Object.keys(rest).length > 0) {
      payload = rest;
    }
  }

  if (payload === undefined) {
    sendError(res, 400, 'Asset payload is required');
    return;
  }

  const result = await store.save({
    path: body.path,
    payload,
    type: assetType,
  });

  logger.info('Asset saved', {
    type: assetType,
    path: body.path,
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
  store: FsAssetStore,
  assetType: AssetType,
  url: URL,
): Promise<void> {
  const assetPath = url.searchParams.get('path');

  if (!assetPath) {
    sendError(res, 400, 'Asset path is required');
    return;
  }

  const result = await store.load({
    path: assetPath,
    type: assetType,
  });

  logger.info('Asset loaded', {
    type: assetType,
    path: assetPath,
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
  store: FsAssetStore,
  assetType: AssetType,
  url: URL,
): Promise<void> {
  const scope = (url.searchParams.get('scope') || 'library') as 'library' | 'scene';
  const sceneName = url.searchParams.get('scene');

  const result = await store.list({
    type: assetType,
    scope,
    sceneName: sceneName || undefined,
  });

  logger.debug('Assets listed', {
    type: assetType,
    scope,
    count: result.length,
  });

  sendJson(res, 200, {
    success: true,
    assets: result,
  });
}

/**
 * Handle delete request
 */
async function handleDelete(
  _req: IncomingMessage,
  res: ServerResponse,
  store: FsAssetStore,
  assetType: AssetType,
  url: URL,
): Promise<void> {
  const assetPath = url.searchParams.get('path');

  if (!assetPath) {
    sendError(res, 400, 'Asset path is required');
    return;
  }

  await store.delete({
    path: assetPath,
    type: assetType,
  });

  logger.info('Asset deleted', {
    type: assetType,
    path: assetPath,
  });

  sendJson(res, 200, {
    success: true,
    message: 'Asset deleted successfully',
  });
}

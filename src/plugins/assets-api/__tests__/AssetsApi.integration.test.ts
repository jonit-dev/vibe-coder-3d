import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FsAssetStore } from '../FsAssetStore';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Integration tests for the Assets API
 * Tests the HTTP endpoints with a mock HTTP server
 */
describe('Assets API Integration', () => {
  let server: http.Server;
  let serverUrl: string;
  let store: FsAssetStore;
  const testDir = path.join(process.cwd(), 'test-assets-api-integration');
  const libraryDir = path.join(testDir, 'library');
  const scenesDir = path.join(testDir, 'scenes');

  beforeAll(async () => {
    // Create test directories
    await fs.mkdir(libraryDir, { recursive: true });
    await fs.mkdir(path.join(libraryDir, 'materials'), { recursive: true });
    await fs.mkdir(path.join(libraryDir, 'inputs'), { recursive: true });
    await fs.mkdir(scenesDir, { recursive: true });

    // Create store
    store = new FsAssetStore(libraryDir, scenesDir);

    // Import utilities after modules are loaded
    const { applyCors, readJsonBody, sendJson, sendError } = await import(
      '../../../core/lib/serialization/common/HttpUtils'
    );
    const { Logger } = await import('../../../core/lib/logger');
    const logger = Logger.create('AssetsApiTest');

    // Create a simple HTTP server that mimics the Assets API
    server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
      try {
        applyCors(res, '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        const url = new URL(req.url!, `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/').filter(Boolean);

        // Extract asset type and action
        let assetType: string;
        let action: string;

        if (pathParts[0] === 'api' && pathParts[1] === 'assets') {
          assetType = pathParts[2];
          action = pathParts[3];
        } else {
          assetType = pathParts[0];
          action = pathParts[1];
        }

        // Validate asset type
        const validTypes = ['material', 'prefab', 'input', 'script'];
        if (!validTypes.includes(assetType)) {
          sendError(res, 404, `Unknown asset type: ${assetType}`);
          return;
        }

        // Route to actions
        if (action === 'save' && req.method === 'POST') {
          const body = await readJsonBody<{ path: string; payload: unknown }>(req, 5_000_000);
          if (!body.path) {
            sendError(res, 400, 'Asset path is required');
            return;
          }
          if (!body.payload) {
            sendError(res, 400, 'Asset payload is required');
            return;
          }

          const result = await store.save({
            path: body.path,
            payload: body.payload,
            type: assetType as any,
          });

          sendJson(res, 200, { success: true, ...result });
        } else if (action === 'load' && req.method === 'GET') {
          const assetPath = url.searchParams.get('path');
          if (!assetPath) {
            sendError(res, 400, 'Asset path is required');
            return;
          }

          const result = await store.load({ path: assetPath, type: assetType as any });
          sendJson(res, 200, { success: true, ...result });
        } else if (action === 'list' && req.method === 'GET') {
          const scope = (url.searchParams.get('scope') || 'library') as 'library' | 'scene';
          const sceneName = url.searchParams.get('scene');

          const result = await store.list({
            type: assetType as any,
            scope,
            sceneName: sceneName || undefined,
          });

          sendJson(res, 200, { success: true, assets: result });
        } else if (action === 'delete' && req.method === 'DELETE') {
          const assetPath = url.searchParams.get('path');
          if (!assetPath) {
            sendError(res, 400, 'Asset path is required');
            return;
          }

          await store.delete({ path: assetPath, type: assetType as any });
          sendJson(res, 200, { success: true, message: 'Asset deleted successfully' });
        } else {
          sendError(res, 404, `Unknown action: ${action || 'none'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        if (errorMessage.includes('not found') || errorMessage.includes('ENOENT')) {
          logger.warn('Asset not found', { error: errorMessage });
          sendError(res, 404, errorMessage);
        } else {
          logger.error('Assets API error', { error });
          sendError(res, 500, errorMessage);
        }
      }
    });

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        serverUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  }, 30000);

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await fs.rm(testDir, { recursive: true, force: true });
  });

  beforeEach(async () => {
    // Clean up between tests
    await fs.rm(path.join(libraryDir, 'materials'), { recursive: true, force: true });
    await fs.mkdir(path.join(libraryDir, 'materials'), { recursive: true });
  });

  describe('POST /api/assets/:type/save', () => {
    it('should save a material to library', async () => {
      const material = {
        id: 'test-material',
        name: 'Test Material',
        shader: 'standard',
        color: '#ff0000',
      };

      const response = await fetch(`${serverUrl}/api/assets/material/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '@/materials/TestMaterial',
          payload: material,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.filename).toBe('TestMaterial.material.tsx');
      expect(data.path).toBe('@/materials/TestMaterial');
      expect(data.size).toBeGreaterThan(0);

      // Verify file was created
      const filePath = path.join(libraryDir, 'materials', 'TestMaterial.material.tsx');
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should save an input asset to library', async () => {
      const inputAsset = {
        name: 'Test Input',
        controlSchemes: [],
        actionMaps: [],
      };

      const response = await fetch(`${serverUrl}/api/assets/input/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '@/inputs/TestInput',
          payload: inputAsset,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.filename).toBe('TestInput.input.tsx');
    });

    it('should return 400 if path is missing', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: { id: 'test' },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('path is required');
    });

    it('should return 400 if payload is missing', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '@/materials/Test',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('payload is required');
    });
  });

  describe('GET /api/assets/:type/load', () => {
    beforeEach(async () => {
      // Create a test material file
      const materialContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterial({
  "id": "load-test",
  "name": "Load Test Material",
  "shader": "standard",
  "color": "#00ff00"
});`;

      await fs.writeFile(
        path.join(libraryDir, 'materials', 'LoadTest.material.tsx'),
        materialContent,
      );
    });

    it('should load a material from library', async () => {
      const response = await fetch(
        `${serverUrl}/api/assets/material/load?path=@/materials/LoadTest`,
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.filename).toBe('LoadTest.material.tsx');
      expect(data.payload).toEqual({
        id: 'load-test',
        name: 'Load Test Material',
        shader: 'standard',
        color: '#00ff00',
      });
    });

    it('should return 400 if path parameter is missing', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/load`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('path is required');
    });

    it('should return 404 if asset not found', async () => {
      const response = await fetch(
        `${serverUrl}/api/assets/material/load?path=@/materials/NonExistent`,
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeTruthy();
      expect(data.error).toMatch(/ENOENT|not found/i);
    });
  });

  describe('GET /api/assets/:type/list', () => {
    beforeEach(async () => {
      // Create multiple test materials
      const material1 = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';
export default defineMaterial({ "id": "mat1", "name": "Material 1" });`;

      const material2 = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';
export default defineMaterial({ "id": "mat2", "name": "Material 2" });`;

      await fs.mkdir(path.join(libraryDir, 'materials', 'subfolder'), { recursive: true });
      await fs.writeFile(path.join(libraryDir, 'materials', 'Mat1.material.tsx'), material1);
      await fs.writeFile(
        path.join(libraryDir, 'materials', 'subfolder', 'Mat2.material.tsx'),
        material2,
      );
    });

    it('should list all library materials', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/list?scope=library`);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(2);
      expect(data.assets[0]).toHaveProperty('filename');
      expect(data.assets[0]).toHaveProperty('path');
      expect(data.assets[0]).toHaveProperty('size');
      expect(data.assets[0]).toHaveProperty('type', 'material');

      // Check paths
      const paths = data.assets.map((a: any) => a.path);
      expect(paths).toContain('@/materials/Mat1');
      expect(paths).toContain('@/materials/subfolder/Mat2');
    });

    it('should list scene-local assets', async () => {
      // Create a scene with materials file
      const sceneDir = path.join(scenesDir, 'TestScene');
      await fs.mkdir(sceneDir, { recursive: true });
      const sceneMaterials = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';
export default defineMaterials([{ "id": "scene-mat", "name": "Scene Material" }]);`;
      await fs.writeFile(path.join(sceneDir, 'TestScene.materials.tsx'), sceneMaterials);

      const response = await fetch(
        `${serverUrl}/api/assets/material/list?scope=scene&scene=TestScene`,
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(1);
      expect(data.assets[0].path).toBe('./materials/TestScene');
    });

    it('should default to library scope if not specified', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/list`);

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.assets).toHaveLength(2); // From beforeEach
    });
  });

  describe('DELETE /api/assets/:type/delete', () => {
    beforeEach(async () => {
      // Create a test material to delete
      const materialContent = `import { defineMaterial } from '@core/lib/serialization/assets/defineMaterials';
export default defineMaterial({ "id": "delete-test", "name": "Delete Test" });`;
      await fs.writeFile(
        path.join(libraryDir, 'materials', 'DeleteTest.material.tsx'),
        materialContent,
      );
    });

    it('should delete a material', async () => {
      // Verify file exists before deletion
      const filePath = path.join(libraryDir, 'materials', 'DeleteTest.material.tsx');
      let fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      const response = await fetch(
        `${serverUrl}/api/assets/material/delete?path=@/materials/DeleteTest`,
        {
          method: 'DELETE',
        },
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');

      // Verify file was deleted
      fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    });

    it('should return 400 if path parameter is missing', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/delete`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('path is required');
    });

    it('should return 404 if asset does not exist', async () => {
      const response = await fetch(
        `${serverUrl}/api/assets/material/delete?path=@/materials/NonExistent`,
        {
          method: 'DELETE',
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Asset type validation', () => {
    it('should return 404 for unknown asset type', async () => {
      const response = await fetch(`${serverUrl}/api/assets/invalid-type/list`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Unknown asset type');
    });

    it('should support all valid asset types', async () => {
      const types = ['material', 'prefab', 'input', 'script'];

      for (const type of types) {
        const response = await fetch(`${serverUrl}/api/assets/${type}/list?scope=library`);
        expect(response.ok).toBe(true);
      }
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight request', async () => {
      const response = await fetch(`${serverUrl}/api/assets/material/list`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});

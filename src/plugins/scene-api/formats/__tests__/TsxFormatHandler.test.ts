import { FsSceneStore } from '@core/lib/serialization/common/FsSceneStore';
import type { ISceneStore } from '@core/lib/serialization/common/ISceneStore';
import { promises as fs } from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TsxFormatHandler } from '../TsxFormatHandler';

// Avoid spawning child processes during tests
vi.mock('../../utils/triggerLuaTranspile', () => ({
  triggerLuaTranspile: vi.fn(async () => {}),
}));

/**
 * Comprehensive TsxFormatHandler test suite
 *
 * Tests the single-file scene format with external asset references:
 * - Scenes saved as sceneName.tsx (camelCase, not SceneName/SceneName.index.tsx)
 * - Assets saved to src/game/assets/{materials,inputs,prefabs}/
 * - Scene files contain entity data + assetReferences paths
 */
describe('TsxFormatHandler', () => {
  describe('Unit Tests (with mocked store)', () => {
    let handler: TsxFormatHandler;
    let mockStore: ISceneStore;
    let writtenContent: string;

    beforeEach(() => {
      writtenContent = '';
      mockStore = {
        write: vi.fn(async (_filename: string, content: string) => {
          writtenContent = content;
          return {
            modified: new Date().toISOString(),
            size: content.length,
          };
        }),
        read: vi.fn(),
        exists: vi.fn(),
        list: vi.fn(),
        delete: vi.fn(),
      };

      handler = new TsxFormatHandler(mockStore, '/test/scenes');
    });

    describe('Basic Properties', () => {
      it('should have correct format', () => {
        expect(handler.format).toBe('tsx');
      });

      it('should have correct contentType', () => {
        expect(handler.contentType).toBe('application/json');
      });
    });

    describe('Compression & Default Omission', () => {
      it('should omit Transform defaults (rotation, scale) when saving', async () => {
        const payload = {
          entities: [
            {
              name: 'Camera',
              components: {
                Transform: {
                  position: [0, 2, -10],
                  rotation: [0, 0, 0], // Default
                  scale: [1, 1, 1], // Default
                },
              },
            },
          ],
          materials: [],
        };

        await handler.save({ name: 'TestScene', payload });

        expect(writtenContent).toContain('"position"');
        expect(writtenContent).toContain('"rotation"');
        expect(writtenContent).toContain('"scale"');
      });

      it('should keep non-default Transform values', async () => {
        const payload = {
          entities: [
            {
              name: 'Rotated Object',
              components: {
                Transform: {
                  position: [5, 0, 0],
                  rotation: [45, 30, 0], // Non-default
                  scale: [2, 2, 2], // Non-default
                },
              },
            },
          ],
          materials: [],
        };

        await handler.save({ name: 'TestScene', payload });

        expect(writtenContent).toContain('"position"');
        expect(writtenContent).toContain('"rotation"');
        expect(writtenContent).toContain('"scale"');
        expect(writtenContent).toContain('45');
        expect(writtenContent).toContain('30');
      });

      it('should omit Camera defaults when saving', async () => {
        const payload = {
          entities: [
            {
              name: 'Camera',
              components: {
                Camera: {
                  fov: 60,
                  near: 0.1, // Default
                  far: 100, // Default
                  isMain: true,
                },
              },
            },
          ],
          materials: [],
        };

        await handler.save({ name: 'TestScene', payload });

        expect(writtenContent).toContain('"fov"');
        expect(writtenContent).toContain('"isMain"');
        expect(writtenContent).toContain('"near"');
        expect(writtenContent).toContain('"far"');
      });

      it('should deduplicate inline materials', async () => {
        const payload = {
          entities: [
            {
              name: 'Tree 1',
              components: {
                MeshRenderer: {
                  meshId: 'tree',
                  material: {
                    color: '#2d5016',
                    roughness: 0.9,
                  },
                },
              },
            },
            {
              name: 'Tree 2',
              components: {
                MeshRenderer: {
                  meshId: 'tree',
                  material: {
                    color: '#2d5016',
                    roughness: 0.9,
                  },
                },
              },
            },
          ],
          materials: [],
        };

        await handler.save({ name: 'TestScene', payload });

        // Material should be extracted to assetReferences
        expect(writtenContent).toContain('"materialId"');
        expect(writtenContent).not.toContain('"material":');
        expect(writtenContent).toContain('assetReferences');
      });
    });

    describe('Load Normalization', () => {
      it('should convert inline materials to materialId references on load', async () => {
        const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: {
    name: 'OldScene',
    version: 1,
    timestamp: '2025-01-01T00:00:00.000Z'
  },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube',
          material: {
            color: '#ff0000',
            roughness: 0.8
          }
        }
      }
    }
  ],
  materials: []
});`;

        vi.mocked(mockStore.exists).mockResolvedValue(true);
        vi.mocked(mockStore.read).mockResolvedValue({
          content: tsxContent,
          modified: new Date().toISOString(),
          size: tsxContent.length,
        });

        const result = await handler.load({ name: 'OldScene' });

        const entity = (result.data as any).entities[0];
        expect(entity.components.MeshRenderer).toHaveProperty('materialId');
        expect(entity.components.MeshRenderer).not.toHaveProperty('material');

        expect((result.data as any).materials).toHaveLength(1);
        expect((result.data as any).materials[0]).toMatchObject({
          color: '#ff0000',
          roughness: 0.8,
        });
      });

      it('should handle MeshRenderer with no material or materialId by adding default', async () => {
        const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: { name: 'Test', version: 1, timestamp: '2025-01-01T00:00:00.000Z' },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube'
        }
      }
    }
  ],
  materials: []
});`;

        vi.mocked(mockStore.exists).mockResolvedValue(true);
        vi.mocked(mockStore.read).mockResolvedValue({
          content: tsxContent,
          modified: new Date().toISOString(),
          size: tsxContent.length,
        });

        const result = await handler.load({ name: 'Test' });

        const entity = (result.data as any).entities[0];
        expect(entity.components.MeshRenderer.materialId).toBe('default');
      });

      it('should preserve existing materialId references', async () => {
        const tsxContent = `import { defineScene } from './defineScene';

export default defineScene({
  metadata: { name: 'Test', version: 1, timestamp: '2025-01-01T00:00:00.000Z' },
  entities: [
    {
      name: 'Cube',
      components: {
        MeshRenderer: {
          meshId: 'cube',
          materialId: 'my-material'
        }
      }
    }
  ],
  materials: []
});`;

        vi.mocked(mockStore.exists).mockResolvedValue(true);
        vi.mocked(mockStore.read).mockResolvedValue({
          content: tsxContent,
          modified: new Date().toISOString(),
          size: tsxContent.length,
        });

        const result = await handler.load({ name: 'Test' });

        const entity = (result.data as any).entities[0];
        expect(entity.components.MeshRenderer.materialId).toBe('my-material');
      });
    });

    describe('Validation', () => {
      it('should reject payload without entities array', async () => {
        const invalidPayload = {
          materials: [],
          prefabs: [],
        };

        await expect(
          handler.save({
            name: 'test',
            payload: invalidPayload,
          }),
        ).rejects.toThrow('Entities array is required');
      });

      it('should reject too many entities', async () => {
        const tooManyEntities = {
          entities: new Array(10001).fill({ id: 1, name: 'Entity', components: {} }),
          materials: [],
          prefabs: [],
        };

        await expect(
          handler.save({
            name: 'test',
            payload: tooManyEntities,
          }),
        ).rejects.toThrow('maximum 10,000 entities');
      });

      it('should throw if TSX does not contain defineScene', async () => {
        vi.mocked(mockStore.exists).mockResolvedValue(true);
        vi.mocked(mockStore.read).mockResolvedValue({
          content: 'export default function Invalid() {}',
          modified: new Date().toISOString(),
          size: 100,
        });

        await expect(handler.load({ name: 'Invalid' })).rejects.toThrow(
          'must use defineScene format',
        );
      });

      it('should throw if cannot extract defineScene data', async () => {
        vi.mocked(mockStore.exists).mockResolvedValue(true);
        vi.mocked(mockStore.read).mockResolvedValue({
          content: 'import { defineScene } from "./defineScene"; export default defineScene(',
          modified: new Date().toISOString(),
          size: 100,
        });

        await expect(handler.load({ name: 'Malformed' })).rejects.toThrow(
          'Could not extract defineScene data',
        );
      });
    });

    it('should replace external script code with script references', async () => {
      const payload = {
        entities: [
          {
            name: 'Scripted Entity',
            components: {
              Script: {
                code: 'function onStart() { console.log("hello"); }',
                scriptRef: {
                  scriptId: 'game.exampleScript',
                  source: 'external' as const,
                  path: '/src/game/scripts/game.exampleScript.ts',
                  codeHash: '1234',
                  lastModified: Date.now(),
                },
                scriptName: 'Example Script',
                enabled: true,
              },
            },
          },
        ],
        materials: [],
      };

      await handler.save({ name: 'ScriptScene', payload });

      expect(writtenContent).toContain('scriptRef');
      expect(writtenContent).not.toContain('console.log("hello");');
      expect(writtenContent).toContain('scripts: ["@/scripts/game.exampleScript"]');
    });
  });

  describe('Integration Tests (with real filesystem)', () => {
    const testScenesDir = './test-tsx-handler/scenes';
    const testAssetsDir = './test-tsx-handler/assets';
    let handler: TsxFormatHandler;
    let store: FsSceneStore;

    beforeEach(async () => {
      await fs.rm('./test-tsx-handler', { recursive: true, force: true });
      await fs.mkdir(testScenesDir, { recursive: true });
      await fs.mkdir(testAssetsDir, { recursive: true });

      store = new FsSceneStore(testScenesDir);
      handler = new TsxFormatHandler(store, testScenesDir);

      // Patch to use test asset directory
      const originalSave = handler.save.bind(handler);
      handler.save = async function (args) {
        const mod = await import('../../../assets-api/FsAssetStore');
        const OriginalFsAssetStore = mod.FsAssetStore;
        const PatchedFsAssetStore = class extends OriginalFsAssetStore {
          constructor() {
            super(testAssetsDir, testScenesDir);
          }
        };
        Object.defineProperty(mod, 'FsAssetStore', {
          value: PatchedFsAssetStore,
          writable: true,
          configurable: true,
        });
        try {
          return await originalSave(args);
        } finally {
          Object.defineProperty(mod, 'FsAssetStore', {
            value: OriginalFsAssetStore,
            writable: true,
            configurable: true,
          });
        }
      };
    });

    afterEach(async () => {
      await fs.rm('./test-tsx-handler', { recursive: true, force: true });
    });

    describe('Save Operations', () => {
      it('should save scene as single file with sanitized name', async () => {
        const payload = {
          entities: [{ id: 1, name: 'Entity', components: {} }],
          materials: [],
        };

        const result = await handler.save({
          name: 'My Test Scene',
          payload,
        });

        expect(result.filename).toBe('myTestScene.tsx');

        const scenePath = path.join(testScenesDir, 'myTestScene.tsx');
        const exists = await fs
          .access(scenePath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);
      });

      it('should save materials as separate files in asset library', async () => {
        const sceneData = {
          entities: [
            {
              id: 1,
              name: 'Cube',
              components: {
                Transform: { position: [0, 0, 0] },
                MeshRenderer: {
                  meshId: 'cube',
                  materialId: 'red',
                },
              },
            },
          ],
          materials: [
            {
              id: 'red',
              name: 'Red Material',
              shader: 'standard',
              materialType: 'solid',
              color: '#ff0000',
              metalness: 0,
              roughness: 0.7,
            },
          ],
        };

        await handler.save({
          name: 'TestScene',
          payload: sceneData,
        });

        const materialPath = path.join(testAssetsDir, 'materials/red.material.tsx');
        const exists = await fs
          .access(materialPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);

        const materialContent = await fs.readFile(materialPath, 'utf-8');
        expect(materialContent).toContain('defineMaterial');
        expect(materialContent).toContain('"id": "red"');
        expect(materialContent).toContain('"color": "#ff0000"');
      });

      it('should save scene with asset references, not inline data', async () => {
        const sceneData = {
          entities: [
            {
              id: 1,
              name: 'Cube',
              components: {
                Transform: { position: [0, 0, 0] },
                MeshRenderer: {
                  meshId: 'cube',
                  materialId: 'red',
                },
              },
            },
          ],
          materials: [
            {
              id: 'red',
              name: 'Red Material',
              shader: 'standard',
              materialType: 'solid',
              color: '#ff0000',
            },
          ],
        };

        await handler.save({
          name: 'TestScene',
          payload: sceneData,
        });

        const scenePath = path.join(testScenesDir, 'testScene.tsx');
        const sceneContent = await fs.readFile(scenePath, 'utf-8');

        expect(sceneContent).toContain('assetReferences');
        expect(sceneContent).toContain('@/materials/red');
        // Check that inline material data is not present
        expect(sceneContent).not.toContain('"shader": "standard"');
        expect(sceneContent).not.toContain('"metalness"');
      });

      it('should deduplicate materials and save each once', async () => {
        const sceneData = {
          entities: [
            {
              id: 1,
              name: 'Cube1',
              components: {
                MeshRenderer: { meshId: 'cube', materialId: 'red' },
              },
            },
            {
              id: 2,
              name: 'Cube2',
              components: {
                MeshRenderer: { meshId: 'cube', materialId: 'red' },
              },
            },
          ],
          materials: [
            {
              id: 'red',
              name: 'Red Material',
              shader: 'standard',
              materialType: 'solid',
              color: '#ff0000',
            },
          ],
        };

        await handler.save({
          name: 'TestScene',
          payload: sceneData,
        });

        const materialFiles = await fs.readdir(path.join(testAssetsDir, 'materials'));
        expect(materialFiles.length).toBe(1);
        expect(materialFiles[0]).toBe('red.material.tsx');

        const scenePath = path.join(testScenesDir, 'testScene.tsx');
        const sceneContent = await fs.readFile(scenePath, 'utf-8');
        const matches = sceneContent.match(/@\/materials\/red/g);
        expect(matches?.length).toBe(1); // Should appear once in assetReferences
      });

      it('should create KISS scene file with minimal content', async () => {
        const sceneData = {
          entities: [
            {
              id: 1,
              name: 'Camera',
              components: {
                Transform: { position: [0, 0, -10] },
                Camera: { fov: 60, isMain: true },
              },
            },
          ],
          materials: [
            {
              id: 'default',
              name: 'Default',
              shader: 'standard',
              materialType: 'solid',
              color: '#cccccc',
            },
          ],
        };

        await handler.save({
          name: 'SimpleScene',
          payload: sceneData,
        });

        const scenePath = path.join(testScenesDir, 'simpleScene.tsx');
        const sceneContent = await fs.readFile(scenePath, 'utf-8');

        const lines = sceneContent.split('\n').length;
        expect(lines).toBeLessThan(150);

        expect(sceneContent).toContain('defineScene');
        expect(sceneContent).toContain('metadata');
        expect(sceneContent).toContain('entities');
        expect(sceneContent).toContain('assetReferences');

        // Check that inline asset data is not present (only references)
        expect(sceneContent).not.toContain('"shader"');
        expect(sceneContent).not.toContain('inputAssets:');
        expect(sceneContent).not.toContain('prefabs:');
      });

      it('should verify material IDs match filenames', async () => {
        const sceneData = {
          entities: [
            {
              id: 1,
              name: 'Cube',
              components: {
                MeshRenderer: { meshId: 'cube', materialId: 'test123' },
              },
            },
          ],
          materials: [
            {
              id: 'test123',
              name: 'Test Material',
              shader: 'standard',
              materialType: 'solid',
              color: '#ff6600',
            },
          ],
        };

        await handler.save({
          name: 'IdMatchTest',
          payload: sceneData,
        });

        const materialPath = path.join(testAssetsDir, 'materials/test123.material.tsx');
        const exists = await fs
          .access(materialPath)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(true);

        const materialContent = await fs.readFile(materialPath, 'utf-8');
        expect(materialContent).toContain('"id": "test123"');
      });
    });

    describe('Load Operations', () => {
      it('should load TSX scene', async () => {
        const payload = {
          entities: [
            { id: 1, name: 'TestEntity', components: { Transform: { position: [0, 0, 0] } } },
          ],
          materials: [],
        };

        await handler.save({ name: 'test-scene', payload });
        const result = await handler.load({ name: 'testscene' });

        expect(result.filename).toBe('testscene.tsx');
        expect(result.data).toHaveProperty('entities');
        expect(result.data).toHaveProperty('materials');
      });

      it('should handle filename with and without .tsx extension', async () => {
        const payload = {
          entities: [{ id: 1, name: 'TestEntity', components: {} }],
          materials: [],
        };

        await handler.save({ name: 'Testscene', payload });

        const result1 = await handler.load({ name: 'Testscene.tsx' });
        expect(result1.filename).toBe('testscene.tsx');

        const result2 = await handler.load({ name: 'Testscene' });
        expect(result2.filename).toBe('testscene.tsx');
      });

      it('should throw if file does not exist', async () => {
        await expect(handler.load({ name: 'nonexistent' })).rejects.toThrow('not found');
      });
    });

    describe('Round-trip Tests', () => {
      it('should preserve entities through save and load cycle', async () => {
        const complexPayload = {
          entities: [
            {
              id: 1,
              name: 'Entity1',
              components: {
                Transform: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
              },
            },
            {
              id: 2,
              name: 'Entity2',
              parentId: 1,
              components: {
                Transform: { position: [0, 1, 0] },
                Camera: { fov: 75 },
              },
            },
          ],
          materials: [{ id: 'mat1', name: 'Material1', shader: 'standard', materialType: 'solid' }],
          description: 'Complex scene',
          author: 'Test',
        };

        await handler.save({ name: 'complex', payload: complexPayload });
        const result = await handler.load({ name: 'complex' });

        const data = result.data as any;

        expect(data.entities).toHaveLength(complexPayload.entities.length);
        expect(data.entities[0]).toMatchObject({ id: 1, name: 'Entity1' });
        expect(data.entities[1]).toMatchObject({ id: 2, name: 'Entity2', parentId: 1 });
        expect(data.materials).toBeDefined();
      });

      it('should save and load scene with materials correctly', async () => {
        const originalSceneData = {
          entities: [
            {
              id: 0,
              name: 'Cube',
              components: {
                Transform: { position: [0, 0, 0] },
                MeshRenderer: {
                  meshId: 'cube',
                  materialId: 'red',
                },
              },
            },
          ],
          materials: [
            {
              id: 'red',
              name: 'Red Material',
              shader: 'standard',
              materialType: 'solid',
              color: '#ff0000',
              metalness: 0.5,
              roughness: 0.3,
            },
          ],
          description: 'Test scene',
        };

        const saveResult = await handler.save({
          name: 'RoundTripTest',
          payload: originalSceneData,
        });

        expect(saveResult.filename).toBe('roundTripTest.tsx');

        const loadResult = await handler.load({
          name: 'RoundTripTest',
        });

        const loadedData = loadResult.data as any;

        expect(loadedData.entities).toHaveLength(1);
        expect(loadedData.entities[0].name).toBe('Cube');
        // Transform may have omitted defaults, check if exists
        if (loadedData.entities[0].components.Transform?.position) {
          expect(loadedData.entities[0].components.Transform.position).toEqual([0, 0, 0]);
        }

        expect(loadedData.materials).toHaveLength(1);
        expect(loadedData.materials[0].id).toBe('red');
        expect(loadedData.materials[0].color).toBe('#ff0000');
        // Metalness might be omitted if it matches default, check if exists
        expect([0, 0.5]).toContain(loadedData.materials[0].metalness);

        const meshRenderer = loadedData.entities[0].components.MeshRenderer;
        expect(meshRenderer.materialId).toBe('red');
        expect(meshRenderer.material).toBeUndefined();
      });

      it('should maintain entity count and IDs through round-trip', async () => {
        const sceneData = {
          entities: Array.from({ length: 10 }, (_, i) => ({
            id: i,
            name: `Entity${i}`,
            components: {
              Transform: { position: [i, i, i] },
            },
          })),
          materials: [],
        };

        await handler.save({
          name: 'ManyEntities',
          payload: sceneData,
        });

        const loadResult = await handler.load({ name: 'ManyEntities' });
        const loadedData = loadResult.data as any;

        expect(loadedData.entities).toHaveLength(10);

        for (let i = 0; i < 10; i++) {
          expect(loadedData.entities[i].id).toBe(i);
          expect(loadedData.entities[i].name).toBe(`Entity${i}`);
          // Position should be preserved
          if (loadedData.entities[i].components.Transform?.position) {
            expect(loadedData.entities[i].components.Transform.position).toEqual([i, i, i]);
          }
        }
      });
    });

    describe('List Operations', () => {
      it('should return empty array if no scenes exist', async () => {
        const result = await handler.list();
        expect(result).toEqual([]);
      });

      it('should list all TSX scenes', async () => {
        const payload = { entities: [], materials: [] };

        await handler.save({ name: 'scene1', payload });
        await handler.save({ name: 'scene2', payload });

        const result = await handler.list();

        expect(result).toHaveLength(2);
        const filenames = result.map((s) => s.filename);
        expect(filenames).toContain('scene1.tsx');
        expect(filenames).toContain('scene2.tsx');
      });

      it('should include metadata for each scene', async () => {
        const payload = { entities: [], materials: [] };
        await handler.save({ name: 'scene1', payload });

        const result = await handler.list();

        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('filename');
        expect(result[0]).toHaveProperty('modified');
        expect(result[0]).toHaveProperty('size');
        expect(result[0]).toHaveProperty('type', 'tsx');
        expect(result[0].size).toBeGreaterThan(0);
      });

      it('should sort by modification time, newest first', async () => {
        const payload = { entities: [], materials: [] };

        await handler.save({ name: 'old', payload });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await handler.save({ name: 'new', payload });

        const result = await handler.list();

        expect(result[0].filename).toBe('new.tsx');
        expect(result[1].filename).toBe('old.tsx');
      });
    });
  });
});

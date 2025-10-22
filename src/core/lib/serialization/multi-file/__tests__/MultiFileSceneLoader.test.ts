import * as fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMultiFileSceneData } from '../MultiFileSceneLoader';
import { MultiFileSceneLoader } from '../MultiFileSceneLoader';

// Mock fs modules for asset loading
vi.mock('fs/promises');

// Mock the ScriptFileResolver module
vi.mock('../../utils/ScriptFileResolver', () => ({
  readScriptFromFilesystem: vi.fn().mockResolvedValue({
    code: 'export function onStart() { console.log("hello"); }',
    path: 'src/game/scripts/game.testScript.ts',
    codeHash: 'mocked-hash',
    lastModified: 456,
  }),
}));

describe('MultiFileSceneLoader', () => {
  let loader: MultiFileSceneLoader;
  let sceneData: IMultiFileSceneData;

  beforeEach(() => {
    loader = new MultiFileSceneLoader();

    sceneData = {
      metadata: {
        name: 'TestScene',
        version: 2,
        timestamp: '2025-10-11T00:00:00.000Z',
        format: 'multi-file',
      },
      entities: [
        {
          id: 0,
          name: 'Main Camera',
          components: {
            Transform: { position: [0, 5, -20] },
            Camera: { fov: 60, isMain: true },
          },
        },
        {
          id: 1,
          name: 'Tree',
          components: {
            Transform: { position: [-5, 0, 0] },
            MeshRenderer: {
              meshId: 'tree',
              materialRef: './materials/TreeGreen',
            },
          },
        },
      ],
      assetReferences: {
        materials: './TestScene.materials.tsx',
      },
    };

    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.stat).mockReset();
  });

  describe('loadMultiFile', () => {
    it('should load scene data and resolve material references', async () => {
      // Mock material file content
      const mockMaterialContent = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterials([
  {
    "id": "TreeGreen",
    "name": "Tree Green",
    "color": "#2d5016",
    "roughness": 0.9
  }
]);`;

      // Mock the asset file reading since we're not mocking fs globally anymore
      const mockAssetContent = `import { defineMaterials } from '@core/lib/serialization/assets/defineMaterials';

export default defineMaterials([
  {
    "id": "TreeGreen",
    "name": "Tree Green",
    "color": "#2d5016",
    "roughness": 0.9
  }
]);`;

      // We need to mock fs for this specific test since the loader reads asset files
      vi.mocked(fs.readFile).mockResolvedValue(mockAssetContent);

      const result = await loader.loadMultiFile(sceneData, 'src/game/scenes/TestScene');

      expect(result.entities).toHaveLength(2);
      expect(result.metadata.name).toBe('TestScene');
    });

    it('should extract inline materials from resolved entities', async () => {
      // For this test, we need entities with inline materials already present
      const sceneDataWithInline: IMultiFileSceneData = {
        metadata: {
          name: 'TestScene',
          version: 2,
          timestamp: '2025-10-11T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Tree',
            components: {
              Transform: { position: [-5, 0, 0] },
              MeshRenderer: {
                meshId: 'tree',
                material: {
                  id: 'TreeGreen',
                  name: 'Tree Green',
                  shader: 'standard',
                  materialType: 'solid',
                  color: '#2d5016',
                  roughness: 0.9,
                  metalness: 0,
                  emissive: '#000000',
                  emissiveIntensity: 0,
                  normalScale: 1,
                  occlusionStrength: 1,
                  textureOffsetX: 0,
                  textureOffsetY: 0,
                  textureRepeatX: 1,
                  textureRepeatY: 1,
                },
              },
            },
          },
        ],
      };

      const result = await loader.loadMultiFile(sceneDataWithInline, 'src/game/scenes/TestScene');

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].id).toBe('TreeGreen');
    });

    it('should handle entities without material references', async () => {
      const simpleSceneData: IMultiFileSceneData = {
        metadata: {
          name: 'SimpleScene',
          version: 2,
          timestamp: '2025-10-11T00:00:00.000Z',
        },
        entities: [
          {
            id: 0,
            name: 'Camera',
            components: {
              Transform: { position: [0, 0, 0] },
              Camera: { fov: 60 },
            },
          },
        ],
      };

      const result = await loader.loadMultiFile(simpleSceneData, 'src/game/scenes/SimpleScene');

      expect(result.entities).toHaveLength(1);
      expect(result.materials).toHaveLength(0);
    });

    it('should preserve metadata', async () => {
      const result = await loader.loadMultiFile(sceneData, 'src/game/scenes/TestScene');

      expect(result.metadata.name).toBe('TestScene');
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.format).toBe('multi-file');
    });

    it('should handle missing material references gracefully', async () => {
      // Mock file read to throw error
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      vi.mocked(fs.stat).mockRejectedValue(new Error('File not found'));

      // Should not throw, just log warning
      const result = await loader.loadMultiFile(sceneData, 'src/game/scenes/TestScene');

      expect(result.entities).toHaveLength(2);
      // Entity should still be present even though material failed to resolve
      expect(result.entities[1].name).toBe('Tree');
    });

    it('should deduplicate materials', async () => {
      const sceneDataWithDuplicates: IMultiFileSceneData = {
        metadata: {
          name: 'TestScene',
          version: 2,
          timestamp: '2025-10-11T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Tree1',
            components: {
              Transform: { position: [-5, 0, 0] },
              MeshRenderer: {
                meshId: 'tree',
                material: {
                  id: 'TreeGreen',
                  name: 'Tree Green',
                  shader: 'standard',
                  materialType: 'solid',
                  color: '#2d5016',
                  roughness: 0.9,
                  metalness: 0,
                  emissive: '#000000',
                  emissiveIntensity: 0,
                  normalScale: 1,
                  occlusionStrength: 1,
                  textureOffsetX: 0,
                  textureOffsetY: 0,
                  textureRepeatX: 1,
                  textureRepeatY: 1,
                },
              },
            },
          },
          {
            id: 2,
            name: 'Tree2',
            components: {
              Transform: { position: [5, 0, 0] },
              MeshRenderer: {
                meshId: 'tree',
                material: {
                  id: 'TreeGreen',
                  name: 'Tree Green',
                  shader: 'standard',
                  materialType: 'solid',
                  color: '#2d5016',
                  roughness: 0.9,
                  metalness: 0,
                  emissive: '#000000',
                  emissiveIntensity: 0,
                  normalScale: 1,
                  occlusionStrength: 1,
                  textureOffsetX: 0,
                  textureOffsetY: 0,
                  textureRepeatX: 1,
                  textureRepeatY: 1,
                },
              },
            },
          },
        ],
      };

      const result = await loader.loadMultiFile(
        sceneDataWithDuplicates,
        'src/game/scenes/TestScene',
      );

      // Should only have one material despite two entities using it
      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].id).toBe('TreeGreen');
    });

    it('should hydrate external script components using asset references', async () => {
      const scriptSceneData: IMultiFileSceneData = {
        metadata: {
          name: 'ScriptScene',
          version: 1,
          timestamp: '2025-10-11T00:00:00.000Z',
        },
        entities: [
          {
            id: 10,
            name: 'Scripted Entity',
            components: {
              Script: {
                enabled: true,
                scriptName: 'Test Script',
                scriptRef: {
                  scriptId: 'game.testScript',
                  source: 'external',
                  path: './src/game/scripts/game.testScript.ts',
                },
              },
            },
          },
        ],
        assetReferences: {
          scripts: ['@/scripts/game.testScript'],
        },
      };

      const result = await loader.loadMultiFile(scriptSceneData, 'src/game/scenes/ScriptScene');

      expect(result.entities).toHaveLength(1);
      const scriptComponent = result.entities[0].components.Script as Record<string, unknown>;
      expect(scriptComponent.code).toContain('console.log("hello")');
      const scriptRef = scriptComponent.scriptRef as Record<string, unknown>;
      expect(scriptRef.codeHash).toBeDefined();
      expect(scriptRef.path).toContain('game.testScript.ts');
    });
  });

  describe('clearCache', () => {
    it('should clear asset resolution cache', () => {
      loader.clearCache();
      // No error should occur
      expect(true).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = loader.getCacheStats();
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });
});

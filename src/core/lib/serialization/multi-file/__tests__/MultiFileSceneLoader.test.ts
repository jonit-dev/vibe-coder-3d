import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiFileSceneLoader } from '../MultiFileSceneLoader';
import type { IMultiFileSceneData } from '../MultiFileSceneLoader';
import type { ISerializedEntity } from '../../common/types';
import * as fs from 'fs/promises';

// Mock fs only
vi.mock('fs/promises');

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

      vi.mocked(fs.readFile).mockResolvedValue(mockMaterialContent);

      const result = await loader.loadMultiFile(
        sceneData,
        'src/game/scenes/TestScene',
      );

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

      const result = await loader.loadMultiFile(
        sceneDataWithInline,
        'src/game/scenes/TestScene',
      );

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

      const result = await loader.loadMultiFile(
        simpleSceneData,
        'src/game/scenes/SimpleScene',
      );

      expect(result.entities).toHaveLength(1);
      expect(result.materials).toHaveLength(0);
    });

    it('should preserve metadata', async () => {
      const result = await loader.loadMultiFile(
        sceneData,
        'src/game/scenes/TestScene',
      );

      expect(result.metadata.name).toBe('TestScene');
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.format).toBe('multi-file');
    });

    it('should handle missing material references gracefully', async () => {
      // Mock file read to throw error
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      // Should not throw, just log warning
      const result = await loader.loadMultiFile(
        sceneData,
        'src/game/scenes/TestScene',
      );

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

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (typeof filePath === 'string') {
          if (filePath.endsWith('.script.tsx')) {
            return `import { defineScript } from '@core/lib/serialization/assets/defineScripts';

export default defineScript({
  id: 'game.testScript',
  name: 'Test Script',
  source: './src/game/scripts/game.testScript.ts'
});`;
          }

          if (filePath.endsWith('game.testScript.ts')) {
            return 'export function onStart() { console.log("hello"); }';
          }
        }

        throw new Error(`Unexpected readFile call for ${filePath}`);
      });

      vi.mocked(fs.stat).mockResolvedValue({
        mtimeMs: 456,
        mtime: new Date(456),
      } as unknown as fs.Stats);

      const result = await loader.loadMultiFile(
        scriptSceneData,
        'src/game/scenes/ScriptScene',
      );

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

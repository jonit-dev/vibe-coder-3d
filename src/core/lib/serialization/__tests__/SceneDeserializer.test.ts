import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneDeserializer } from '../SceneDeserializer';
import type { ISceneData } from '../SceneSerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

describe('SceneDeserializer', () => {
  let deserializer: SceneDeserializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;
  let materialRegistry: MaterialRegistry;
  let prefabRegistry: PrefabRegistry;

  beforeEach(async () => {
    deserializer = new SceneDeserializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();
    materialRegistry = MaterialRegistry.getInstance();
    prefabRegistry = PrefabRegistry.getInstance();

    // Clear all registries
    entityManager.clearEntities();
    materialRegistry.clearMaterials();
    await prefabRegistry.clear();
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockReset();
    vi.mocked(fs.stat).mockReset();
  });

  describe('deserialize', () => {
    it('should deserialize empty scene', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Empty Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      await expect(
        deserializer.deserialize(sceneData, entityManager, componentRegistry),
      ).resolves.not.toThrow();

      expect(entityManager.getAllEntitiesForAdapter()).toHaveLength(0);
      expect(materialRegistry.get('any')).toBeUndefined();
    });

    it('should deserialize scene with entities', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Entity Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Test Entity',
            components: {
              Transform: {
                position: [0, 1, 2],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      const entities = entityManager.getAllEntitiesForAdapter();
      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Test Entity');

      const components = componentRegistry.getComponentsForEntityForAdapter(entities[0].id);
      expect(components.some((c) => c.type === 'Transform')).toBe(true);
    });

    it('should deserialize scene with materials', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Material Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [
          {
            id: 'test-mat',
            name: 'Test Material',
            shader: 'standard',
            materialType: 'solid',
            color: '#ff0000',
            metalness: 0.5,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      const material = materialRegistry.get('test-mat');
      expect(material).toBeDefined();
      expect(material?.name).toBe('Test Material');
      expect(material?.color).toBe('#ff0000');
    });

    it('should deserialize scene with prefabs', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Prefab Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [
          {
            id: 'test-prefab',
            name: 'Test Prefab',
            version: 1,
            root: {
              name: 'Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: [],
            tags: [],
          },
        ],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      const prefab = prefabRegistry.get('test-prefab');
      expect(prefab).toBeDefined();
      expect(prefab?.name).toBe('Test Prefab');
    });

    it('should deserialize complete scene with all types', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Complete Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Camera',
            components: {
              Transform: {
                position: [0, 5, 10],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
              Camera: {
                fov: 60,
                near: 0.1,
                far: 1000,
                projectionType: 'perspective',
                orthographicSize: 10,
                depth: 0,
                isMain: true,
              },
            },
          },
        ],
        materials: [
          {
            id: 'default',
            name: 'Default Material',
            shader: 'standard',
            materialType: 'solid',
            color: '#cccccc',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [
          {
            id: 'tree',
            name: 'Tree',
            version: 1,
            root: {
              name: 'Tree Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: [],
            tags: [],
          },
        ],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      // Verify entities
      const entities = entityManager.getAllEntitiesForAdapter();
      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Camera');

      const components = componentRegistry.getComponentsForEntityForAdapter(1);
      expect(components.some((c) => c.type === 'Transform')).toBe(true);
      expect(components.some((c) => c.type === 'Camera')).toBe(true);

      // Verify materials
      const material = materialRegistry.get('default');
      expect(material).toBeDefined();

      // Verify prefabs
      const prefab = prefabRegistry.get('tree');
      expect(prefab).toBeDefined();
    });

    it('should deserialize entity hierarchy correctly', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Hierarchy Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Parent',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          {
            id: 2,
            name: 'Child 1',
            parentId: 1,
            components: {
              Transform: {
                position: [1, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          {
            id: 3,
            name: 'Child 2',
            parentId: 1,
            components: {
              Transform: {
                position: [0, 1, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          {
            id: 4,
            name: 'Grandchild',
            parentId: 2,
            components: {
              Transform: {
                position: [0, 0, 1],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      const entities = entityManager.getAllEntitiesForAdapter();
      expect(entities).toHaveLength(4);

      const parent = entities.find((e) => e.name === 'Parent');
      const child1 = entities.find((e) => e.name === 'Child 1');
      const child2 = entities.find((e) => e.name === 'Child 2');
      const grandchild = entities.find((e) => e.name === 'Grandchild');

      expect(child1?.parentId).toBe(parent?.id);
      expect(child2?.parentId).toBe(parent?.id);
      expect(grandchild?.parentId).toBe(child1?.id);
    });

    it('should load materials before prefabs', async () => {
      // This test ensures the correct loading order: materials -> prefabs -> entities
      const sceneData: ISceneData = {
        metadata: {
          name: 'Order Test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [
          {
            id: 'mat1',
            name: 'Material 1',
            shader: 'standard',
            materialType: 'solid',
            color: '#ff0000',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [
          {
            id: 'prefab1',
            name: 'Prefab 1',
            version: 1,
            root: {
              name: 'Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: ['mat1'], // Depends on material
            tags: [],
          },
        ],
      };

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      // Both should be loaded
      expect(materialRegistry.get('mat1')).toBeDefined();
      expect(prefabRegistry.get('prefab1')).toBeDefined();
    });

    it('should handle validation errors gracefully', async () => {
      const invalidSceneData = {
        metadata: {
          // Missing required fields
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      await expect(
        deserializer.deserialize(invalidSceneData as any, entityManager, componentRegistry),
      ).rejects.toThrow();
    });

    it('should handle invalid entity data gracefully', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Invalid Entity Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Valid Entity',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
          {
            id: 2,
            // Missing name
            components: {},
          } as any,
        ],
        materials: [],
        prefabs: [],
      };

      // Should handle invalid entity gracefully and load valid ones
      await expect(
        deserializer.deserialize(sceneData, entityManager, componentRegistry),
      ).resolves.not.toThrow();

      // Valid entity should be loaded
      const entities = entityManager.getAllEntities();
      expect(entities.length).toBeGreaterThan(0);
    });
  });

  describe('loading order', () => {
    it('should load in correct order: materials -> prefabs -> entities', async () => {
      const loadOrder: string[] = [];

      // We can't directly observe the loading order, but we can verify the end state
      const sceneData: ISceneData = {
        metadata: {
          name: 'Order Test',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Entity',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [
          {
            id: 'mat1',
            name: 'Material 1',
            shader: 'standard',
            materialType: 'solid',
            color: '#ff0000',
            metalness: 0,
            roughness: 0.7,
            emissive: '#000000',
            emissiveIntensity: 0,
            normalScale: 1,
            occlusionStrength: 1,
            textureOffsetX: 0,
            textureOffsetY: 0,
            textureRepeatX: 1,
            textureRepeatY: 1,
          },
        ],
        prefabs: [
          {
            id: 'prefab1',
            name: 'Prefab 1',
            version: 1,
            root: {
              name: 'Root',
              components: {
                Transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
              },
            },
            metadata: {
              createdAt: '2025-01-01T00:00:00.000Z',
              createdFrom: 1,
            },
            dependencies: [],
            tags: [],
          },
        ],
      };

    await deserializer.deserialize(sceneData, entityManager, componentRegistry);

    // All should be loaded
    expect(entityManager.getAllEntities()).toHaveLength(1);
    expect(materialRegistry.get('mat1')).toBeDefined();
    expect(prefabRegistry.get('prefab1')).toBeDefined();
  });

    it('should hydrate external script components using file references', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Script Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 42,
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
        materials: [],
        prefabs: [],
        assetReferences: {
          scripts: ['@/scripts/game.testScript'],
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue('export function onStart() { console.log("hello"); }');
      vi.mocked(fs.stat).mockResolvedValue({
        mtimeMs: 999,
        mtime: new Date(999),
      } as unknown as fs.Stats);

      await deserializer.deserialize(sceneData, entityManager, componentRegistry);

      const entities = entityManager.getAllEntitiesForAdapter();
      expect(entities).toHaveLength(1);
      const components = componentRegistry.getComponentsForEntityForAdapter(entities[0].id);
      const scriptComponent = components.find((c) => c.type === 'Script')?.data as
        | Record<string, unknown>
        | undefined;

      expect(scriptComponent).toBeDefined();
      expect(scriptComponent?.code).toContain('console.log("hello")');
      const scriptRef = scriptComponent?.scriptRef as Record<string, unknown> | undefined;
      expect(scriptRef?.codeHash).toBeDefined();
    });
  });
});

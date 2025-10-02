import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneLoader } from '../SceneLoader';
import type { ISceneData } from '../SceneSerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentManager } from '@core/lib/ecs/ComponentManager';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';

describe('SceneLoader', () => {
  let loader: SceneLoader;
  let entityManager: EntityManager;
  let componentManager: ComponentManager;
  let materialRegistry: MaterialRegistry;
  let prefabRegistry: PrefabRegistry;

  beforeEach(async () => {
    loader = new SceneLoader();
    entityManager = EntityManager.getInstance();
    componentManager = ComponentManager.getInstance();
    materialRegistry = MaterialRegistry.getInstance();
    prefabRegistry = PrefabRegistry.getInstance();

    // Clear all registries
    entityManager.clearEntities();
    materialRegistry.clearMaterials();
    await prefabRegistry.clear();
  });

  describe('load', () => {
    it('should load empty scene', async () => {
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

      await expect(loader.load(sceneData, entityManager, componentManager)).resolves.not.toThrow();
    });

    it('should load complete scene', async () => {
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

      await loader.load(sceneData, entityManager, componentManager);

      // Verify all loaded
      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(materialRegistry.get('default')).toBeDefined();
      expect(prefabRegistry.get('tree')).toBeDefined();
    });

    it('should call store refresher when provided', async () => {
      const refreshMaterials = vi.fn();
      const refreshPrefabs = vi.fn();

      const sceneData: ISceneData = {
        metadata: {
          name: 'Test Scene',
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
        prefabs: [],
      };

      await loader.load(sceneData, entityManager, componentManager, {
        refreshMaterials,
        refreshPrefabs,
      });

      expect(refreshMaterials).toHaveBeenCalled();
      expect(refreshPrefabs).toHaveBeenCalled();
    });

    it('should work without store refresher', async () => {
      const sceneData: ISceneData = {
        metadata: {
          name: 'Test Scene',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [],
        materials: [],
        prefabs: [],
      };

      await expect(loader.load(sceneData, entityManager, componentManager)).resolves.not.toThrow();
    });
  });

  describe('loadStatic', () => {
    it('should load static scene data', async () => {
      const entities = [
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
      ];

      const materials = [
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
      ];

      const prefabs = [
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
      ];

      await loader.loadStatic(entities, materials, prefabs, entityManager, componentManager);

      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(materialRegistry.get('mat1')).toBeDefined();
      expect(prefabRegistry.get('prefab1')).toBeDefined();
    });

    it('should load in correct order: materials -> prefabs -> entities', async () => {
      const entities = [
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
      ];

      const materials = [
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
      ];

      const prefabs = [
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
      ];

      await loader.loadStatic(entities, materials, prefabs, entityManager, componentManager);

      // All should be loaded
      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(materialRegistry.get('mat1')).toBeDefined();
      expect(prefabRegistry.get('prefab1')).toBeDefined();
    });

    it('should call store refresher when provided', async () => {
      const refreshMaterials = vi.fn();
      const refreshPrefabs = vi.fn();

      await loader.loadStatic([], [], [], entityManager, componentManager, {
        refreshMaterials,
        refreshPrefabs,
      });

      expect(refreshMaterials).toHaveBeenCalled();
      expect(refreshPrefabs).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all scene data', async () => {
      // Load some data first
      const sceneData: ISceneData = {
        metadata: {
          name: 'Test Scene',
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

      await loader.load(sceneData, entityManager, componentManager);

      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(materialRegistry.get('mat1')).toBeDefined();
      expect(prefabRegistry.get('prefab1')).toBeDefined();

      // Now clear
      await loader.clear(entityManager);

      expect(entityManager.getAllEntities()).toHaveLength(0);
      expect(materialRegistry.get('mat1')).toBeUndefined();
      expect(prefabRegistry.get('prefab1')).toBeUndefined();
    });

    it('should call store refresher when provided', async () => {
      const refreshMaterials = vi.fn();
      const refreshPrefabs = vi.fn();

      await loader.clear(entityManager, {
        refreshMaterials,
        refreshPrefabs,
      });

      expect(refreshMaterials).toHaveBeenCalled();
      expect(refreshPrefabs).toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    it('should handle full scene lifecycle: load -> modify -> clear', async () => {
      // Load initial scene
      const sceneData: ISceneData = {
        metadata: {
          name: 'Lifecycle Test',
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
        materials: [],
        prefabs: [],
      };

      await loader.load(sceneData, entityManager, componentManager);
      expect(entityManager.getAllEntities()).toHaveLength(1);

      // Modify scene
      const newEntity = entityManager.createEntity('New Entity');
      componentManager.addComponent(newEntity.id, 'Transform', {
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      expect(entityManager.getAllEntities()).toHaveLength(2);

      // Clear scene
      await loader.clear(entityManager);
      expect(entityManager.getAllEntities()).toHaveLength(0);
    });

    it('should handle loading different scenes sequentially', async () => {
      // Load first scene
      const scene1: ISceneData = {
        metadata: {
          name: 'Scene 1',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Entity 1',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      await loader.load(scene1, entityManager, componentManager);
      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(entityManager.getAllEntities()[0].name).toBe('Entity 1');

      // Clear and load second scene
      await loader.clear(entityManager);

      const scene2: ISceneData = {
        metadata: {
          name: 'Scene 2',
          version: 1,
          timestamp: '2025-01-01T00:00:00.000Z',
        },
        entities: [
          {
            id: 1,
            name: 'Entity 2',
            components: {
              Transform: {
                position: [1, 1, 1],
                rotation: [0, 0, 0],
                scale: [1, 1, 1],
              },
            },
          },
        ],
        materials: [],
        prefabs: [],
      };

      await loader.load(scene2, entityManager, componentManager);
      expect(entityManager.getAllEntities()).toHaveLength(1);
      expect(entityManager.getAllEntities()[0].name).toBe('Entity 2');
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { SceneSerializer } from '../SceneSerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { MaterialRegistry } from '@core/materials/MaterialRegistry';
import { PrefabRegistry } from '@core/prefabs/PrefabRegistry';
import type { IMaterialDefinition } from '@core/materials';
import type { IPrefabDefinition } from '@core/prefabs';

describe('SceneSerializer', () => {
  let serializer: SceneSerializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;
  let materialRegistry: MaterialRegistry;
  let prefabRegistry: PrefabRegistry;

  beforeEach(async () => {
    serializer = new SceneSerializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();
    materialRegistry = MaterialRegistry.getInstance();
    prefabRegistry = PrefabRegistry.getInstance();

    // Clear all registries
    entityManager.clearEntities();
    materialRegistry.clearMaterials();
    await prefabRegistry.clear();
  });

  describe('serialize', () => {
    it('should serialize empty scene', async () => {
      const metadata = {
        name: 'Empty Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.metadata.name).toBe(metadata.name);
      expect(result.metadata.version).toBe(metadata.version);
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.entities).toEqual([]);
      expect(result.materials).toHaveLength(1); // Default material always present
      expect(result.materials[0].id).toBe('default');
      expect(result.prefabs).toEqual([]);
    });

    it('should serialize scene with entities only', async () => {
      const entity = entityManager.createEntity('Test Entity');
      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const metadata = {
        name: 'Entity Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].name).toBe('Test Entity');
      expect(result.materials).toHaveLength(1); // Default material always present
      expect(result.materials[0].id).toBe('default');
      expect(result.prefabs).toHaveLength(0);
    });

    it('should serialize scene with materials only', async () => {
      const material: IMaterialDefinition = {
        id: 'test-mat',
        name: 'Test Material',
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
      };

      materialRegistry.upsert(material);

      const metadata = {
        name: 'Material Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(0);
      expect(result.materials).toHaveLength(2); // Default + test-mat
      expect(result.materials.some((m) => m.id === 'test-mat')).toBe(true);
      expect(result.materials.some((m) => m.id === 'default')).toBe(true);
      expect(result.prefabs).toHaveLength(0);
    });

    it('should serialize scene with prefabs only', async () => {
      const prefab: IPrefabDefinition = {
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
      };

      prefabRegistry.upsert(prefab);

      const metadata = {
        name: 'Prefab Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(0);
      expect(result.materials).toHaveLength(1); // Default material always present
      expect(result.materials[0].id).toBe('default');
      expect(result.prefabs).toHaveLength(1);
      expect(result.prefabs[0].id).toBe('test-prefab');
    });

    it('should serialize complete scene with all types', async () => {
      // Add entity
      const entity = entityManager.createEntity('Camera');
      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [0, 5, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      componentRegistry.addComponent(entity.id, 'Camera', {
        fov: 60,
        near: 0.1,
        far: 1000,
        isMain: true,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
      });

      // Add material
      const material: IMaterialDefinition = {
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
      };
      materialRegistry.upsert(material);

      // Add prefab
      const prefab: IPrefabDefinition = {
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
      };
      prefabRegistry.upsert(prefab);

      const metadata = {
        name: 'Complete Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.metadata.name).toBe(metadata.name);
      expect(result.metadata.version).toBe(metadata.version);
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.entities).toHaveLength(1);
      expect(result.materials).toHaveLength(1);
      expect(result.prefabs).toHaveLength(1);

      // Verify structure
      expect(result.entities[0].name).toBe('Camera');
      expect(result.entities[0].components).toHaveProperty('Transform');
      expect(result.entities[0].components).toHaveProperty('Camera');

      expect(result.materials[0].id).toBe('default');
      expect(result.prefabs[0].id).toBe('tree');
    });

    it('should preserve entity hierarchy in serialization', async () => {
      const parent = entityManager.createEntity('Parent');
      const child1 = entityManager.createEntity('Child 1', parent.id);
      const child2 = entityManager.createEntity('Child 2', parent.id);
      const grandchild = entityManager.createEntity('Grandchild', child1.id);

      [parent, child1, child2, grandchild].forEach((entity) => {
        componentRegistry.addComponent(entity.id, 'Transform', {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        });
      });

      const metadata = {
        name: 'Hierarchy Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(4);

      const serializedChild1 = result.entities.find((e) => e.name === 'Child 1');
      const serializedChild2 = result.entities.find((e) => e.name === 'Child 2');
      const serializedGrandchild = result.entities.find((e) => e.name === 'Grandchild');

      expect(serializedChild1?.parentId).toBe(parent.id);
      expect(serializedChild2?.parentId).toBe(parent.id);
      expect(serializedGrandchild?.parentId).toBe(child1.id);
    });

    it('should include all component data', async () => {
      const entity = entityManager.createEntity('Camera Entity');

      componentRegistry.addComponent(entity.id, 'Transform', {
        position: [5, 10, 5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      componentRegistry.addComponent(entity.id, 'Camera', {
        fov: 60,
        near: 0.1,
        far: 1000,
        isMain: true,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
      });

      const metadata = {
        name: 'Component Data Scene',
        version: 1,
        timestamp: '2025-01-01T00:00:00.000Z',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.entities).toHaveLength(1);
      const serializedEntity = result.entities[0];

      // With compression enabled (default), Transform defaults are omitted
      expect(serializedEntity.components.Transform).toMatchObject({
        position: [5, 10, 5],
        // rotation and scale omitted (match defaults)
      });

      // Camera non-default values are included
      const cameraData = serializedEntity.components.Camera as any;
      expect(cameraData.fov).toBe(60); // Non-default (default is 75)
      expect(cameraData.far).toBe(1000); // Non-default (default is 100)
      expect(cameraData.isMain).toBe(true); // Non-default (default is false)
      // projectionType is 'perspective' which matches the default, so it's omitted
      expect(cameraData.projectionType).toBeUndefined(); // Matches default ('perspective')
      // Default values should be omitted
      expect(cameraData.near).toBeUndefined(); // Matches default (0.1)
      expect(cameraData.orthographicSize).toBeUndefined(); // Matches default (10)
      expect(cameraData.depth).toBeUndefined(); // Matches default (0)
    });
  });

  it('should omit external script code and record script references', async () => {
    const entity = entityManager.createEntity('Scripted Entity');
    const scriptRef = {
      scriptId: 'game.playerController',
      source: 'external' as const,
      path: '/src/game/scripts/game.playerController.ts',
      codeHash: 'abc123',
      lastModified: Date.now(),
    };

    componentRegistry.addComponent(entity.id, 'Script', {
      code: 'function onStart() { console.log("hello"); }',
      enabled: true,
      scriptName: 'Player Controller',
      scriptRef,
      parameters: { speed: 5 },
    });

    const result = await serializer.serialize(entityManager, componentRegistry, {
      name: 'Script Scene',
      version: 1,
    });

    expect(result.entities).toHaveLength(1);
    const scriptComponent = result.entities[0].components.Script as Record<string, unknown>;
    expect(scriptComponent).toBeDefined();
    expect(scriptComponent.code).toBeUndefined();
    expect(scriptComponent.scriptRef).toEqual(scriptRef);
    expect(result.assetReferences?.scripts).toEqual(['@/scripts/game.playerController']);
  });

  describe('metadata handling', () => {
    it('should include provided metadata', async () => {
      const metadata = {
        name: 'Test Scene',
        version: 2,
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata);

      expect(result.metadata.name).toBe('Test Scene');
      expect(result.metadata.version).toBe(2);
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should handle metadata with custom properties', async () => {
      const metadata = {
        name: 'Custom Scene',
        version: 1,
        author: 'Test Author',
        description: 'Test description',
      };

      const result = await serializer.serialize(entityManager, componentRegistry, metadata as any);

      expect(result.metadata).toMatchObject({
        name: 'Custom Scene',
        version: 1,
        author: 'Test Author',
        description: 'Test description',
      });
      expect(result.metadata.timestamp).toBeDefined();
    });
  });
});

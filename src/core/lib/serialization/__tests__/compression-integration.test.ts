import { describe, it, expect, beforeEach } from 'vitest';
import { StreamingSceneSerializer } from '../StreamingSceneSerializer';
import type { IStreamingScene } from '../StreamingSceneSerializer';

/**
 * Integration tests for compression system
 * Tests that compressed scenes can be imported with defaults restored
 */
describe('Compression Integration', () => {
  let serializer: StreamingSceneSerializer;
  let mockEntityManager: any;
  let mockComponentManager: any;
  let createdEntities: Map<string, number>;
  let addedComponents: Array<{ entityId: number; type: string; data: any }>;

  beforeEach(() => {
    serializer = new StreamingSceneSerializer();
    createdEntities = new Map();
    addedComponents = [];

    let nextEntityId = 1;

    mockEntityManager = {
      clearEntities: () => {
        createdEntities.clear();
      },
      createEntity: (name: string, _parentId?: any, _persistentId?: string) => {
        const id = nextEntityId++;
        createdEntities.set(name, id);
        return { id };
      },
      setParent: () => {},
    };

    mockComponentManager = {
      addComponent: (entityId: number, componentType: string, componentData: unknown) => {
        addedComponents.push({ entityId, type: componentType, data: componentData });
      },
    };
  });

  it('should restore Transform defaults when importing compressed scene', async () => {
    const compressedScene: IStreamingScene = {
      version: 1,
      name: 'Test',
      timestamp: new Date().toISOString(),
      totalEntities: 1,
      entities: [
        {
          id: 1,
          name: 'Camera',
          components: {
            Transform: {
              position: [0, 2, -10],
              // rotation and scale omitted (defaults)
            },
          },
        },
      ],
      materials: [],
      prefabs: [],
      inputAssets: [],
    };

    await serializer.importScene(compressedScene, mockEntityManager, mockComponentManager);

    // Find the Transform component
    const transformComponent = addedComponents.find(
      (c) => c.type === 'Transform' && c.entityId === 1,
    );

    expect(transformComponent).toBeDefined();
    expect(transformComponent!.data).toEqual({
      position: [0, 2, -10],
      rotation: [0, 0, 0], // Default restored
      scale: [1, 1, 1], // Default restored
    });
  });

  it('should restore Camera defaults when importing compressed scene', async () => {
    const compressedScene: IStreamingScene = {
      version: 1,
      name: 'Test',
      timestamp: new Date().toISOString(),
      totalEntities: 1,
      entities: [
        {
          id: 1,
          name: 'Camera',
          components: {
            Camera: {
              fov: 60,
              isMain: true,
              // All other fields omitted (defaults)
            },
          },
        },
      ],
      materials: [],
      prefabs: [],
      inputAssets: [],
    };

    await serializer.importScene(compressedScene, mockEntityManager, mockComponentManager);

    const cameraComponent = addedComponents.find((c) => c.type === 'Camera' && c.entityId === 1);

    expect(cameraComponent).toBeDefined();
    expect(cameraComponent!.data).toMatchObject({
      fov: 60,
      isMain: true,
      near: 0.1, // Default restored
      far: 100, // Default restored
      projectionType: 'perspective', // Default restored
    });
  });

  it('should restore Light defaults when importing compressed scene', async () => {
    const compressedScene: IStreamingScene = {
      version: 1,
      name: 'Test',
      timestamp: new Date().toISOString(),
      totalEntities: 1,
      entities: [
        {
          id: 1,
          name: 'Light',
          components: {
            Light: {
              lightType: 'directional',
              // All other fields omitted (defaults)
            },
          },
        },
      ],
      materials: [],
      prefabs: [],
      inputAssets: [],
    };

    await serializer.importScene(compressedScene, mockEntityManager, mockComponentManager);

    const lightComponent = addedComponents.find((c) => c.type === 'Light' && c.entityId === 1);

    expect(lightComponent).toBeDefined();
    expect(lightComponent!.data).toMatchObject({
      lightType: 'directional',
      intensity: 1, // Default restored
      enabled: true, // Default restored
      castShadow: true, // Default restored
    });
  });

  it('should not modify components that have no defaults', async () => {
    const compressedScene: IStreamingScene = {
      version: 1,
      name: 'Test',
      timestamp: new Date().toISOString(),
      totalEntities: 1,
      entities: [
        {
          id: 1,
          name: 'Entity',
          components: {
            CustomComponent: {
              customField: 'value',
            },
          },
        },
      ],
      materials: [],
      prefabs: [],
      inputAssets: [],
    };

    await serializer.importScene(compressedScene, mockEntityManager, mockComponentManager);

    const customComponent = addedComponents.find(
      (c) => c.type === 'CustomComponent' && c.entityId === 1,
    );

    expect(customComponent).toBeDefined();
    expect(customComponent!.data).toEqual({
      customField: 'value',
    });
  });

  it('should handle multiple entities with compressed components', async () => {
    const compressedScene: IStreamingScene = {
      version: 1,
      name: 'Test',
      timestamp: new Date().toISOString(),
      totalEntities: 3,
      entities: [
        {
          id: 1,
          name: 'Tree 1',
          components: {
            Transform: { position: [-2, 0, 0] },
          },
        },
        {
          id: 2,
          name: 'Tree 2',
          components: {
            Transform: { position: [2, 0, 0] },
          },
        },
        {
          id: 3,
          name: 'Tree 3',
          components: {
            Transform: { position: [0, 0, 3] },
          },
        },
      ],
      materials: [],
      prefabs: [],
      inputAssets: [],
    };

    await serializer.importScene(compressedScene, mockEntityManager, mockComponentManager);

    const transformComponents = addedComponents.filter((c) => c.type === 'Transform');

    expect(transformComponents).toHaveLength(3);

    // All should have defaults restored
    transformComponents.forEach((comp) => {
      expect(comp.data).toHaveProperty('rotation');
      expect(comp.data).toHaveProperty('scale');
      expect(comp.data.rotation).toEqual([0, 0, 0]);
      expect(comp.data.scale).toEqual([1, 1, 1]);
    });
  });
});

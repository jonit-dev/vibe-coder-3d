import { describe, it, expect, beforeEach } from 'vitest';
import { EntitySerializer } from '../EntitySerializer';
import { EntityManager } from '@core/lib/ecs/EntityManager';
import { ComponentRegistry } from '@core/lib/ecs/ComponentRegistry';

/**
 * Test to verify GeometryAsset deserialization from actual scene data
 * This mimics loading the Testphysics.tsx scene
 */
describe('GeometryAsset Deserialization from Scene', () => {
  let serializer: EntitySerializer;
  let entityManager: EntityManager;
  let componentRegistry: ComponentRegistry;

  beforeEach(() => {
    serializer = new EntitySerializer();
    entityManager = EntityManager.getInstance();
    componentRegistry = ComponentRegistry.getInstance();

    // Reset entity manager to clear all state
    entityManager.reset();
  });

  it.skip('should deserialize battleship entity from Testphysics.tsx scene data', () => {
    // ARRANGE: Exact data from Testphysics.tsx
    const sceneEntities = [
      {
        id: 6,
        name: 'Battleship-Optimized 0',
        components: {
          PersistentId: {
            id: '6bb4a460-c024-4fb2-89b8-1e4b33a2f113',
          },
          Transform: {
            position: [0, 0.25, 0],
            scale: [0.5, 0.5, 0.5],
          },
          GeometryAsset: {
            path: '/src/game/geometry/battleship.shape.json',
          },
        },
      },
    ];

    // ACT: Deserialize
    serializer.deserialize(sceneEntities, entityManager, componentRegistry);

    // ASSERT: Entity was created
    const allEntities = entityManager.getAllEntities();
    expect(allEntities).toHaveLength(1);

    const entity = allEntities[0];
    expect(entity.name).toBe('Battleship-Optimized 0');

    // ASSERT: All components were added
    const components = componentRegistry.getEntityComponents(entity.id);
    expect(components).toContain('Transform');
    expect(components).toContain('GeometryAsset');
    expect(components).toContain('PersistentId');

    // ASSERT: Transform data is correct
    const transform = componentRegistry.getComponentData(entity.id, 'Transform');
    expect(transform).toBeDefined();
    expect(transform).toMatchObject({
      position: [0, 0.25, 0],
      rotation: [0, 0, 0], // defaults restored
      scale: [0.5, 0.5, 0.5],
    });

    // ASSERT: GeometryAsset data is correct with defaults restored
    const geometryAsset = componentRegistry.getComponentData<Record<string, unknown>>(
      entity.id,
      'GeometryAsset',
    );
    expect(geometryAsset).toBeDefined();
    expect(geometryAsset!.path).toBe('/src/game/geometry/battleship.shape.json');
    expect(geometryAsset!.geometryId).toBe(''); // default restored
    expect(geometryAsset!.materialId).toBe(''); // default restored
    expect(geometryAsset!.enabled).toBe(true); // default restored
    expect(geometryAsset!.castShadows).toBe(true); // default restored
    expect(geometryAsset!.receiveShadows).toBe(true); // default restored

    console.log('✅ GeometryAsset successfully deserialized:');
    console.log(JSON.stringify(geometryAsset, null, 2));
  });

  it.skip('should verify GeometryAsset component exists after deserialization', () => {
    // ARRANGE
    const sceneEntities = [
      {
        id: 6,
        name: 'Battleship',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          GeometryAsset: {
            path: '/src/game/geometry/battleship.shape.json',
          },
        },
      },
    ];

    // ACT
    serializer.deserialize(sceneEntities, entityManager, componentRegistry);

    // ASSERT
    const allEntities = entityManager.getAllEntities();
    expect(allEntities.length).toBeGreaterThan(0);

    const entity = allEntities[0];
    expect(entity).toBeDefined();

    const hasGeometryAsset = componentRegistry.hasComponent(entity.id, 'GeometryAsset');

    if (!hasGeometryAsset) {
      console.error('❌ GeometryAsset component NOT found on entity!');
      console.error('Available components:', componentRegistry.getEntityComponents(entity.id));
    } else {
      console.log('✅ GeometryAsset component found on entity');
    }

    expect(hasGeometryAsset).toBe(true);
  });
});

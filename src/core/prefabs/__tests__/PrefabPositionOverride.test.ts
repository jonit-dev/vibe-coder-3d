import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrefabManager } from '../PrefabManager';
import { PrefabRegistry } from '../PrefabRegistry';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { ECSWorld } from '@/core/lib/ecs/World';
import { initializeECS } from '@/core/lib/ecs/init';
import type { IPrefabDefinition } from '../Prefab.types';

describe('Prefab Position Override', () => {
  let manager: PrefabManager;
  let registry: PrefabRegistry;
  let entityManager: EntityManager;

  beforeEach(() => {
    // Clear first
    const existingManager = PrefabManager.getInstance();
    const existingRegistry = PrefabRegistry.getInstance();
    existingRegistry.clear();
    existingManager.clear();

    // Reset component registry BEFORE re-initializing ECS
    componentRegistry.reset();

    // Initialize ECS - this must be done before any component operations
    const world = ECSWorld.getInstance();
    world.reset();
    initializeECS();

    manager = PrefabManager.getInstance();
    registry = PrefabRegistry.getInstance();
    entityManager = EntityManager.getInstance();

    registry.clear();
    manager.clear();
  });

  afterEach(() => {
    registry.clear();
    manager.clear();
  });

  it('should correctly position root entity when instantiated with position override', () => {
    // Create a simple prefab with a root positioned at origin
    const prefab: IPrefabDefinition = {
      id: 'test-pawn',
      name: 'Test Pawn',
      version: 1,
      root: {
        name: 'Pawn',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshId: 'mesh-box',
            materialId: 'default',
            castShadow: true,
            receiveShadow: true,
            enabled: true,
          },
        },
      },
      dependencies: [],
      tags: ['test'],
      metadata: {},
    };

    registry.upsert(prefab);

    // Instantiate at specific position
    const targetPosition: [number, number, number] = [-2.5, 0, 1];
    const instanceId = manager.instantiate('test-pawn', {
      position: targetPosition,
    });

    // Get transform component
    const transform = componentRegistry.getComponentData(instanceId, 'Transform');
    expect(transform).toBeDefined();

    const actualPosition = (transform as { position: number[] }).position;

    // Position should match exactly what was requested
    expect(actualPosition).toEqual(targetPosition);
    expect(actualPosition[0]).toBe(-2.5);
    expect(actualPosition[1]).toBe(0);
    expect(actualPosition[2]).toBe(1);
  });

  it('should correctly position root entity with children when instantiated with position override', () => {
    // Create a prefab with nested children (like a chessboard piece with a base and top)
    const prefab: IPrefabDefinition = {
      id: 'chess-piece',
      name: 'Chess Piece',
      version: 1,
      root: {
        name: 'ChessPieceRoot',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
        },
        children: [
          {
            name: 'Base',
            components: {
              Transform: {
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                scale: [1, 0.5, 1],
              },
              MeshRenderer: {
                meshId: 'cube',
                materialId: 'default',
                castShadow: true,
                receiveShadow: true,
                enabled: true,
              },
            },
          },
          {
            name: 'Top',
            components: {
              Transform: {
                position: [0, 1, 0],
                rotation: [0, 0, 0],
                scale: [0.5, 1, 0.5],
              },
              MeshRenderer: {
                meshId: 'sphere',
                materialId: 'default',
                castShadow: true,
                receiveShadow: true,
                enabled: true,
              },
            },
          },
        ],
      },
      dependencies: [],
      tags: ['chess'],
      metadata: {},
    };

    registry.upsert(prefab);

    // Instantiate at specific positions
    const positions: [number, number, number][] = [
      [-2.5, 0, 1],
      [-1.5, 0, 1],
      [-0.5, 0, 1],
      [0.5, 0, 1],
      [1.5, 0, 1],
    ];

    const instances = positions.map((pos) => ({
      id: manager.instantiate('chess-piece', { position: pos }),
      expectedPosition: pos,
    }));

    // Verify each instance has the correct position
    instances.forEach(({ id, expectedPosition }, index) => {
      console.log(
        `Testing instance ${index}: entityId=${id}, expectedPosition=${expectedPosition}`,
      );

      // Check if entity exists
      const entity = entityManager.getEntity(id);
      console.log(`Entity exists: ${!!entity}`, entity);

      // Check all components on this entity
      const entityComponents = componentRegistry.getEntityComponents(id);
      console.log(`Entity components: ${entityComponents}`);

      // Check if Transform component is registered
      const hasTransform = componentRegistry.hasComponent(id, 'Transform');
      console.log(`Has Transform: ${hasTransform}`);

      const transform = componentRegistry.getComponentData(id, 'Transform');
      console.log(`Transform data:`, transform);
      expect(transform).toBeDefined();

      const actualPosition = (transform as { position: number[] }).position;

      // Root entity should have exactly the position we specified
      expect(actualPosition).toEqual(expectedPosition);
      expect(actualPosition[0]).toBe(expectedPosition[0]);
      expect(actualPosition[1]).toBe(expectedPosition[1]);
      expect(actualPosition[2]).toBe(expectedPosition[2]);

      // Get the entity to check children
      const entity = entityManager.getEntity(id);
      expect(entity).toBeDefined();
      expect(entity?.children).toBeDefined();
      expect(entity?.children?.length).toBe(2);

      // Children positions should be relative to parent, not absolute
      const baseChild = entityManager.getEntity(entity!.children![0]);
      const topChild = entityManager.getEntity(entity!.children![1]);

      expect(baseChild).toBeDefined();
      expect(topChild).toBeDefined();

      const baseTransform = componentRegistry.getComponentData(baseChild!.id, 'Transform');
      const topTransform = componentRegistry.getComponentData(topChild!.id, 'Transform');

      // Child positions should remain as defined in prefab (relative to parent)
      expect((baseTransform as { position: number[] }).position).toEqual([0, 0, 0]);
      expect((topTransform as { position: number[] }).position).toEqual([0, 1, 0]);
    });
  });

  it('should override position without affecting other transform properties', () => {
    const prefab: IPrefabDefinition = {
      id: 'test-entity',
      name: 'Test Entity',
      version: 1,
      root: {
        name: 'Entity',
        components: {
          Transform: {
            position: [5, 5, 5],
            rotation: [0, Math.PI / 4, 0],
            scale: [2, 2, 2],
          },
          MeshRenderer: {
            meshId: 'mesh-box',
            materialId: 'default',
            castShadow: true,
            receiveShadow: true,
            enabled: true,
          },
        },
      },
      dependencies: [],
      tags: [],
      metadata: {},
    };

    registry.upsert(prefab);

    // Instantiate with only position override
    const newPosition: [number, number, number] = [10, 20, 30];
    const instanceId = manager.instantiate('test-entity', {
      position: newPosition,
    });

    const transform = componentRegistry.getComponentData(instanceId, 'Transform');
    expect(transform).toBeDefined();

    const typedTransform = transform as {
      position: number[];
      rotation: number[];
      scale: number[];
    };

    // Position should be overridden
    expect(typedTransform.position).toEqual(newPosition);

    // Rotation and scale should remain from prefab definition
    expect(typedTransform.rotation).toEqual([0, Math.PI / 4, 0]);
    expect(typedTransform.scale).toEqual([2, 2, 2]);
  });

  it('should handle multiple simultaneous transform overrides', () => {
    const prefab: IPrefabDefinition = {
      id: 'test-multi-override',
      name: 'Test Multi Override',
      version: 1,
      root: {
        name: 'Entity',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshId: 'mesh-box',
            materialId: 'default',
            castShadow: true,
            receiveShadow: true,
            enabled: true,
          },
        },
      },
      dependencies: [],
      tags: [],
      metadata: {},
    };

    registry.upsert(prefab);

    const newPosition: [number, number, number] = [10, 20, 30];
    const newRotation: [number, number, number] = [0, Math.PI, 0];
    const newScale: [number, number, number] = [2, 3, 4];

    const instanceId = manager.instantiate('test-multi-override', {
      position: newPosition,
      rotation: newRotation,
      scale: newScale,
    });

    const transform = componentRegistry.getComponentData(instanceId, 'Transform');
    expect(transform).toBeDefined();

    const typedTransform = transform as {
      position: number[];
      rotation: number[];
      scale: number[];
    };

    expect(typedTransform.position).toEqual(newPosition);
    expect(typedTransform.rotation).toEqual(newRotation);
    expect(typedTransform.scale).toEqual(newScale);
  });
});

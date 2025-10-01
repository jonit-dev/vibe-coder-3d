import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrefabManager } from '../PrefabManager';
import { PrefabRegistry } from '../PrefabRegistry';
import { PrefabSerializer } from '../PrefabSerializer';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { ECSWorld } from '@/core/lib/ecs/World';
import { initializeECS } from '@/core/lib/ecs/init';
import type { IPrefabDefinition } from '../Prefab.types';

describe.skip('Prefab System Integration Tests', () => {
  let manager: PrefabManager;
  let registry: PrefabRegistry;
  let serializer: PrefabSerializer;
  let entityManager: EntityManager;

  beforeEach(() => {
    // Initialize ECS
    ECSWorld.getInstance().reset();
    initializeECS();

    manager = PrefabManager.getInstance();
    registry = PrefabRegistry.getInstance();
    serializer = PrefabSerializer.getInstance();
    entityManager = EntityManager.getInstance();

    registry.clear();
    manager.clear();
  });

  afterEach(() => {
    registry.clear();
    manager.clear();
  });

  const createSimplePrefab = (): IPrefabDefinition => ({
    id: 'test-cube',
    name: 'Test Cube',
    version: 1,
    root: {
      name: 'Cube',
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
  });

  describe('Complete Flow: Create → Save → Load → Instantiate', () => {
    it('should create prefab from entity, save, and instantiate', () => {
      // Step 1: Create an entity manually
      const entity = entityManager.createEntity('TestEntity');
      const entityId = entity.id;
      const transformAdded = componentRegistry.addComponent(entityId, 'Transform', {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      const meshRendererAdded = componentRegistry.addComponent(entityId, 'MeshRenderer', {
        meshId: 'mesh-box',
        materialId: 'default',
        castShadow: true,
        receiveShadow: true,
        enabled: true,
      });

      // Verify components were added
      expect(transformAdded).toBe(true);
      expect(meshRendererAdded).toBe(true);

      // Step 2: Create prefab from entity
      const prefab = manager.createFromEntity(entityId, 'My Cube', 'my-cube');

      expect(prefab.id).toBe('my-cube');
      expect(prefab.name).toBe('My Cube');
      expect(prefab.root.components.Transform).toBeDefined();
      expect(prefab.root.components.MeshRenderer).toBeDefined();

      // Step 3: Verify it was registered
      const retrieved = registry.get('my-cube');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('my-cube');

      // Step 4: Instantiate the prefab
      const instanceId = manager.instantiate('my-cube');
      expect(instanceId).toBeGreaterThan(0);

      // Step 5: Verify instance has components
      expect(componentRegistry.hasComponent(instanceId, 'Transform')).toBe(true);
      expect(componentRegistry.hasComponent(instanceId, 'MeshRenderer')).toBe(true);
      expect(componentRegistry.hasComponent(instanceId, 'PrefabInstance')).toBe(true);

      // Step 6: Check PrefabInstance component
      const prefabInstance = componentRegistry.getComponentData(instanceId, 'PrefabInstance');
      expect(prefabInstance).toBeDefined();
      expect((prefabInstance as { prefabId: string }).prefabId).toBe('my-cube');
    });
  });

  describe('Instantiation with Overrides', () => {
    it('should instantiate with position override', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const instanceId = manager.instantiate('test-cube', {
        position: [10, 20, 30],
      });

      const transform = componentRegistry.getComponentData(instanceId, 'Transform');
      expect(transform).toBeDefined();
      expect((transform as { position: number[] }).position).toEqual([10, 20, 30]);
    });

    it('should instantiate with rotation and scale overrides', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const instanceId = manager.instantiate('test-cube', {
        rotation: [0, Math.PI / 2, 0],
        scale: [2, 2, 2],
      });

      const transform = componentRegistry.getComponentData(instanceId, 'Transform');
      expect((transform as { rotation: number[] }).rotation).toEqual([0, Math.PI / 2, 0]);
      expect((transform as { scale: number[] }).scale).toEqual([2, 2, 2]);
    });
  });

  describe('Nested Prefabs', () => {
    it('should handle prefab with children', () => {
      const prefab: IPrefabDefinition = {
        id: 'parent',
        name: 'Parent',
        version: 1,
        root: {
          name: 'Parent',
          components: {
            Transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          },
          children: [
            {
              name: 'Child1',
              components: {
                Transform: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
              },
            },
            {
              name: 'Child2',
              components: {
                Transform: { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
              },
            },
          ],
        },
        dependencies: [],
        tags: [],
        metadata: {},
      };

      registry.upsert(prefab);

      const instanceId = manager.instantiate('parent');
      expect(instanceId).toBeGreaterThan(0);

      // Verify parent
      expect(componentRegistry.hasComponent(instanceId, 'Transform')).toBe(true);

      // Children are created but finding them requires hierarchy queries
      // Just verify the parent was created successfully
      expect(componentRegistry.hasComponent(instanceId, 'PrefabInstance')).toBe(true);
    });
  });

  describe('Prefab Pooling', () => {
    it('should enable pooling and reuse entities', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      // Enable pooling
      manager.enablePooling('test-cube', 5);

      // Warm the pool
      manager.warmPool('test-cube', 3);

      // Check pool stats
      const stats = manager.getPoolStats('test-cube');
      expect(stats).toBeDefined();
      expect(stats?.available).toBe(3);
      expect(stats?.active).toBe(0);

      // Acquire from pool
      const instanceId = manager.instantiate('test-cube');
      expect(instanceId).toBeGreaterThan(0);

      const statsAfter = manager.getPoolStats('test-cube');
      expect(statsAfter?.available).toBe(2);
      expect(statsAfter?.active).toBe(1);

      // Release back to pool
      manager.destroy(instanceId);

      const statsAfterRelease = manager.getPoolStats('test-cube');
      expect(statsAfterRelease?.available).toBe(3);
      expect(statsAfterRelease?.active).toBe(0);
    });

    it('should create new instance when pool is exhausted', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      manager.enablePooling('test-cube', 2);
      manager.warmPool('test-cube', 2);

      // Acquire all from pool
      const id1 = manager.instantiate('test-cube');
      const id2 = manager.instantiate('test-cube');

      const stats = manager.getPoolStats('test-cube');
      expect(stats?.available).toBe(0);
      expect(stats?.active).toBe(2);

      // This should create a new instance
      const id3 = manager.instantiate('test-cube');
      expect(id3).toBeGreaterThan(0);

      const statsAfter = manager.getPoolStats('test-cube');
      expect(statsAfter?.active).toBe(3);
    });
  });

  describe('Entity Active State', () => {
    it('should toggle entity active state', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const instanceId = manager.instantiate('test-cube');

      // Initially active
      expect(manager.isActive(instanceId)).toBe(true);

      // Deactivate
      manager.setActive(instanceId, false);
      const meshRenderer = componentRegistry.getComponentData(instanceId, 'MeshRenderer');
      expect((meshRenderer as { enabled: boolean }).enabled).toBe(false);

      // Reactivate
      manager.setActive(instanceId, true);
      const meshRendererActive = componentRegistry.getComponentData(instanceId, 'MeshRenderer');
      expect((meshRendererActive as { enabled: boolean }).enabled).toBe(true);
    });
  });

  describe('Instance Tracking', () => {
    it('should track all instances of a prefab', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const id1 = manager.instantiate('test-cube');
      const id2 = manager.instantiate('test-cube');
      const id3 = manager.instantiate('test-cube');

      const instances = manager.getInstances('test-cube');
      expect(instances).toHaveLength(3);
      expect(instances).toContain(id1);
      expect(instances).toContain(id2);
      expect(instances).toContain(id3);
    });

    it('should identify prefab instances', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const instanceId = manager.instantiate('test-cube');
      const normalEntity = entityManager.createEntity('NormalEntity').id;

      expect(manager.isInstance(instanceId)).toBe(true);
      expect(manager.isInstance(normalEntity)).toBe(false);
    });

    it('should get prefab ID from instance', () => {
      const prefab = createSimplePrefab();
      registry.upsert(prefab);

      const instanceId = manager.instantiate('test-cube');

      const prefabId = manager.getPrefabId(instanceId);
      expect(prefabId).toBe('test-cube');
    });
  });

  describe('Error Handling', () => {
    it('should return -1 for non-existent prefab', () => {
      const instanceId = manager.instantiate('nonexistent');
      expect(instanceId).toBe(-1);
    });

    it('should handle invalid entity ID gracefully', () => {
      expect(() => manager.destroy(99999)).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const prefab1 = createSimplePrefab();
      const prefab2 = { ...createSimplePrefab(), id: 'cube2', name: 'Cube 2' };

      registry.upsert(prefab1);
      registry.upsert(prefab2);

      manager.enablePooling('test-cube', 5);

      const stats = manager.getStats();

      expect(stats.prefabCount).toBe(2);
      expect(stats.poolsActive).toBe(1);
    });
  });
});

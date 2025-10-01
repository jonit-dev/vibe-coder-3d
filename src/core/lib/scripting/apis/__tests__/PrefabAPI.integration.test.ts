import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPrefabAPI } from '../PrefabAPI';
import { PrefabManager } from '@/core/prefabs/PrefabManager';
import { PrefabRegistry } from '@/core/prefabs/PrefabRegistry';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { ECSWorld } from '@/core/lib/ecs/World';
import { initializeECS } from '@/core/lib/ecs/init';
import type { IPrefabDefinition } from '@/core/prefabs/Prefab.types';

describe('PrefabAPI Integration Tests', () => {
  let prefabManager: PrefabManager;
  let registry: PrefabRegistry;
  let entityManager: EntityManager;

  beforeEach(() => {
    // Initialize ECS
    ECSWorld.getInstance().reset();
    initializeECS();

    prefabManager = PrefabManager.getInstance();
    registry = PrefabRegistry.getInstance();
    entityManager = EntityManager.getInstance();

    registry.clear();
    prefabManager.clear();

    // Create test prefab
    const testPrefab: IPrefabDefinition = {
      id: 'enemy',
      name: 'Enemy',
      version: 1,
      root: {
        name: 'Enemy',
        components: {
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshType: 'box',
            materialId: 'default',
            castShadow: true,
            receiveShadow: true,
            enabled: true,
          },
        },
      },
      dependencies: [],
      tags: ['enemy', 'ai'],
      metadata: {},
    };

    registry.upsert(testPrefab);
  });

  afterEach(() => {
    registry.clear();
    prefabManager.clear();
  });

  describe('spawn', () => {
    it('should spawn prefab and return entity ID', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy');

      expect(spawnedId).toBeGreaterThan(0);
      expect(spawnedId).not.toBe(-1);

      // Verify entity exists
      expect(componentRegistry.hasComponent(spawnedId, 'Transform')).toBe(true);
      expect(componentRegistry.hasComponent(spawnedId, 'MeshRenderer')).toBe(true);
      expect(componentRegistry.hasComponent(spawnedId, 'PrefabInstance')).toBe(true);
    });

    it('should spawn with position override', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy', {
        position: [10, 5, 20],
      });

      const transform = componentRegistry.getComponentData(spawnedId, 'Transform');
      expect((transform as { position: number[] }).position).toEqual([10, 5, 20]);
    });

    it('should spawn with rotation and scale', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy', {
        position: [0, 0, 0],
        rotation: [0, Math.PI, 0],
        scale: [2, 2, 2],
      });

      const transform = componentRegistry.getComponentData(spawnedId, 'Transform');
      expect((transform as { rotation: number[] }).rotation).toEqual([0, Math.PI, 0]);
      expect((transform as { scale: number[] }).scale).toEqual([2, 2, 2]);
    });

    it('should return -1 for non-existent prefab', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('nonexistent');

      expect(spawnedId).toBe(-1);
    });

    it('should spawn multiple instances', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const ids: number[] = [];
      for (let i = 0; i < 5; i++) {
        ids.push(api.spawn('enemy', { position: [i, 0, 0] }));
      }

      expect(ids).toHaveLength(5);
      expect(new Set(ids).size).toBe(5); // All unique

      // Verify all instances are tracked
      const instances = prefabManager.getInstances('enemy');
      expect(instances).toHaveLength(5);
    });
  });

  describe('destroy', () => {
    it('should destroy spawned entity', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy');
      expect(componentRegistry.hasComponent(spawnedId, 'Transform')).toBe(true);

      api.destroy(spawnedId);

      // Entity should be destroyed (component should not exist)
      expect(componentRegistry.hasComponent(spawnedId, 'Transform')).toBe(false);
    });

    it('should destroy self when no target specified', () => {
      const scriptEntityId = entityManager.createEntity();
      componentRegistry.addComponent(scriptEntityId, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const api = createPrefabAPI(scriptEntityId);

      expect(componentRegistry.hasComponent(scriptEntityId, 'Transform')).toBe(true);

      api.destroy();

      // Self-entity should be destroyed
      expect(componentRegistry.hasComponent(scriptEntityId, 'Transform')).toBe(false);
    });

    it('should handle destroying non-existent entity gracefully', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      expect(() => api.destroy(99999)).not.toThrow();
    });
  });

  describe('setActive', () => {
    it('should deactivate spawned entity', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy');

      // Initially active
      expect(prefabManager.isActive(spawnedId)).toBe(true);

      // Deactivate
      api.setActive(spawnedId, false);

      const meshRenderer = componentRegistry.getComponentData(spawnedId, 'MeshRenderer');
      expect((meshRenderer as { enabled: boolean }).enabled).toBe(false);
    });

    it('should reactivate entity', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      const spawnedId = api.spawn('enemy');

      api.setActive(spawnedId, false);
      api.setActive(spawnedId, true);

      const meshRenderer = componentRegistry.getComponentData(spawnedId, 'MeshRenderer');
      expect((meshRenderer as { enabled: boolean }).enabled).toBe(true);
    });
  });

  describe('realistic gameplay scenario', () => {
    it('should handle spawning wave of enemies', () => {
      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      // Spawn wave in circle pattern
      const waveSize = 8;
      const radius = 10;
      const spawnedEnemies: number[] = [];

      for (let i = 0; i < waveSize; i++) {
        const angle = (i / waveSize) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const enemyId = api.spawn('enemy', {
          position: [x, 0, z],
          rotation: [0, angle, 0],
        });

        spawnedEnemies.push(enemyId);
      }

      expect(spawnedEnemies).toHaveLength(waveSize);

      // Verify positions
      for (let i = 0; i < waveSize; i++) {
        const transform = componentRegistry.getComponentData(spawnedEnemies[i], 'Transform');
        expect(transform).toBeDefined();
        const pos = (transform as { position: number[] }).position;
        expect(Math.abs(Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]) - radius)).toBeLessThan(0.01);
      }

      // Cleanup wave
      spawnedEnemies.forEach((id) => api.destroy(id));

      // Verify all destroyed
      const instances = prefabManager.getInstances('enemy');
      expect(instances).toHaveLength(0);
    });

    it('should support pooling for projectiles', () => {
      // Enable pooling
      prefabManager.enablePooling('enemy', 20);
      prefabManager.warmPool('enemy', 10);

      const scriptEntityId = entityManager.createEntity();
      const api = createPrefabAPI(scriptEntityId);

      // Spawn from pool
      const id1 = api.spawn('enemy', { position: [1, 0, 0] });
      const id2 = api.spawn('enemy', { position: [2, 0, 0] });

      const stats = prefabManager.getPoolStats('enemy');
      expect(stats?.available).toBe(8);
      expect(stats?.active).toBe(2);

      // Return to pool
      api.destroy(id1);

      const statsAfter = prefabManager.getPoolStats('enemy');
      expect(statsAfter?.available).toBe(9);
      expect(statsAfter?.active).toBe(1);
    });
  });
});

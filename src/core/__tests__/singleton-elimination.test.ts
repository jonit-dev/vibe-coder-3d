import { describe, it, expect } from 'vitest';

import { createEngineInstance } from '@core/lib/ecs/factories/createEngineInstance';
import {
  getWorldSingleton,
  getEntityManagerSingleton,
  getComponentManagerSingleton,
} from '@core/lib/ecs/adapters/SingletonAdapter';

describe('Singleton Elimination Integration', () => {
  describe('Factory Function', () => {
    it('should create isolated engine instances', () => {
      const engineA = createEngineInstance();
      const engineB = createEngineInstance();

      expect(engineA).toBeDefined();
      expect(engineB).toBeDefined();
      expect(engineA.world).not.toBe(engineB.world);
      expect(engineA.entityManager).not.toBe(engineB.entityManager);
      expect(engineA.componentManager).not.toBe(engineB.componentManager);

      // Test entity isolation
      const entityA = engineA.entityManager.createEntity('Entity A');
      const entityB = engineB.entityManager.createEntity('Entity B');

      expect(engineA.entityManager.getEntityCount()).toBe(1);
      expect(engineB.entityManager.getEntityCount()).toBe(1);

      // Cross-instance entity access should fail
      expect(engineA.entityManager.getEntity(entityB.id)).toBeUndefined();
      expect(engineB.entityManager.getEntity(entityA.id)).toBeUndefined();

      engineA.dispose();
      engineB.dispose();
    });

    it('should register services in container', () => {
      const engine = createEngineInstance();

      expect(engine.container.has('ECSWorld')).toBe(true);
      expect(engine.container.has('EntityManager')).toBe(true);
      expect(engine.container.has('ComponentManager')).toBe(true);
      expect(engine.container.has('EntityQueries')).toBe(true);

      const resolvedWorld = engine.container.resolve('ECSWorld');
      const resolvedEntityManager = engine.container.resolve('EntityManager');
      const resolvedComponentManager = engine.container.resolve('ComponentManager');

      expect(resolvedWorld).toBe(engine.world);
      expect(resolvedEntityManager).toBe(engine.entityManager);
      expect(resolvedComponentManager).toBe(engine.componentManager);

      engine.dispose();
    });
  });

  describe('Singleton Adapter Compatibility', () => {
    it('should provide singleton fallbacks when no context available', () => {
      // These should work without throwing errors
      const world = getWorldSingleton();
      const entityManager = getEntityManagerSingleton();
      const componentManager = getComponentManagerSingleton();

      expect(world).toBeDefined();
      expect(entityManager).toBeDefined();
      expect(componentManager).toBeDefined();
    });

    it('should maintain backward compatibility', () => {
      const entityManager = getEntityManagerSingleton();
      const componentManager = getComponentManagerSingleton();

      // Should be able to use singleton API
      const entity = entityManager.createEntity('Legacy Entity');
      componentManager.addComponent(entity.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      expect(entity).toBeDefined();
      expect(componentManager.hasComponent(entity.id, 'Transform')).toBe(true);

      // Clean up
      entityManager.deleteEntity(entity.id);
    });
  });

  describe('Component System Integration', () => {
    it('should handle components correctly across instances', () => {
      const engineA = createEngineInstance();
      const engineB = createEngineInstance();

      // Create entities with components in both instances
      const entityA = engineA.entityManager.createEntity('Entity A');
      const entityB = engineB.entityManager.createEntity('Entity B');

      engineA.componentManager.addComponent(entityA.id, 'Transform', {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      engineB.componentManager.addComponent(entityB.id, 'Transform', {
        position: [4, 5, 6],
        rotation: [0, 0, 0],
        scale: [2, 2, 2],
      });

      // Verify component isolation
      const transformA = engineA.componentManager.getComponentData(entityA.id, 'Transform') as any;
      const transformB = engineB.componentManager.getComponentData(entityB.id, 'Transform') as any;

      expect(transformA?.position).toEqual([1, 2, 3]);
      expect(transformB?.position).toEqual([4, 5, 6]);
      expect(transformB?.scale).toEqual([2, 2, 2]);

      // Verify component queries are isolated
      const entitiesWithTransformA = engineA.componentManager.getEntitiesWithComponent('Transform');
      const entitiesWithTransformB = engineB.componentManager.getEntitiesWithComponent('Transform');

      expect(entitiesWithTransformA).toHaveLength(1);
      expect(entitiesWithTransformB).toHaveLength(1);
      expect(entitiesWithTransformA[0]).toBe(entityA.id);
      expect(entitiesWithTransformB[0]).toBe(entityB.id);

      engineA.dispose();
      engineB.dispose();
    });
  });

  describe('Hierarchy System Integration', () => {
    it('should maintain hierarchies within instances', () => {
      const engineA = createEngineInstance();
      const engineB = createEngineInstance();

      // Create hierarchies in both instances
      const parentA = engineA.entityManager.createEntity('Parent A');
      const childA = engineA.entityManager.createEntity('Child A', parentA.id);

      const parentB = engineB.entityManager.createEntity('Parent B');
      const childB = engineB.entityManager.createEntity('Child B', parentB.id);

      // Verify hierarchies are isolated
      expect(childA.parentId).toBe(parentA.id);
      expect(childB.parentId).toBe(parentB.id);

      const childrenA = engineA.entityManager.getChildren(parentA.id);
      const childrenB = engineB.entityManager.getChildren(parentB.id);

      expect(childrenA).toHaveLength(1);
      expect(childrenB).toHaveLength(1);
      expect(childrenA[0].id).toBe(childA.id);
      expect(childrenB[0].id).toBe(childB.id);

      engineA.dispose();
      engineB.dispose();
    });
  });

  describe('Memory Management', () => {
    it('should clean up properly on dispose', () => {
      const engine = createEngineInstance();

      // Add some data
      const entity = engine.entityManager.createEntity('Test Entity');
      engine.componentManager.addComponent(entity.id, 'Transform', {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      expect(engine.entityManager.getEntityCount()).toBe(1);
      expect(engine.componentManager.getEntitiesWithComponent('Transform')).toHaveLength(1);

      // Dispose
      engine.dispose();

      // Container should be cleared
      expect(engine.container.has('ECSWorld')).toBe(false);
      expect(engine.container.has('EntityManager')).toBe(false);
      expect(engine.container.has('ComponentManager')).toBe(false);
    });

    it('should not leak memory between instances', () => {
      const instances: ReturnType<typeof createEngineInstance>[] = [];

      // Create multiple instances
      for (let i = 0; i < 5; i++) {
        const instance = createEngineInstance();

        // Add data to each
        for (let j = 0; j < 10; j++) {
          const entity = instance.entityManager.createEntity(`Entity-${i}-${j}`);
          instance.componentManager.addComponent(entity.id, 'Transform', {
            position: [i, j, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          });
        }

        instances.push(instance);
      }

      // Verify each instance has correct data
      instances.forEach((instance) => {
        expect(instance.entityManager.getEntityCount()).toBe(10);
        expect(instance.componentManager.getEntitiesWithComponent('Transform')).toHaveLength(10);
      });

      // Dispose all
      instances.forEach((instance) => instance.dispose());

      // Verify cleanup
      instances.forEach((instance) => {
        expect(instance.container.has('ECSWorld')).toBe(false);
      });
    });
  });
});

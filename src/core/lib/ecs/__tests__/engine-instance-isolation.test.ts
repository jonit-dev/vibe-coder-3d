import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { createEngineInstance, IEngineInstance } from '../factories/createEngineInstance';

describe('Engine Instance Isolation', () => {
  let instanceA: IEngineInstance;
  let instanceB: IEngineInstance;

  beforeEach(() => {
    instanceA = createEngineInstance();
    instanceB = createEngineInstance();
  });

  afterEach(() => {
    instanceA.dispose();
    instanceB.dispose();
  });

  describe('Basic Isolation', () => {
    it('should create separate world instances', () => {
      expect(instanceA.world).toBeDefined();
      expect(instanceB.world).toBeDefined();
      expect(instanceA.world).not.toBe(instanceB.world);
    });

    it('should create separate entity managers', () => {
      expect(instanceA.entityManager).toBeDefined();
      expect(instanceB.entityManager).toBeDefined();
      expect(instanceA.entityManager).not.toBe(instanceB.entityManager);
    });

    it('should create separate component managers', () => {
      expect(instanceA.componentManager).toBeDefined();
      expect(instanceB.componentManager).toBeDefined();
      expect(instanceA.componentManager).not.toBe(instanceB.componentManager);
    });

    it('should create separate containers', () => {
      expect(instanceA.container).toBeDefined();
      expect(instanceB.container).toBeDefined();
      expect(instanceA.container).not.toBe(instanceB.container);
    });
  });

  describe('Entity Isolation', () => {
    it('should maintain separate entity counts', () => {
      expect(instanceA.entityManager.getEntityCount()).toBe(0);
      expect(instanceB.entityManager.getEntityCount()).toBe(0);

      instanceA.entityManager.createEntity('Entity A1');
      instanceA.entityManager.createEntity('Entity A2');

      instanceB.entityManager.createEntity('Entity B1');

      expect(instanceA.entityManager.getEntityCount()).toBe(2);
      expect(instanceB.entityManager.getEntityCount()).toBe(1);
    });

    it('should not share entities between instances', () => {
      const entityA = instanceA.entityManager.createEntity('Entity A');
      const entityB = instanceB.entityManager.createEntity('Entity B');

      // Entities should not exist in other instances
      expect(instanceA.entityManager.getEntity(entityB.id)).toBeUndefined();
      expect(instanceB.entityManager.getEntity(entityA.id)).toBeUndefined();
    });

    it('should handle entity deletion independently', () => {
      const entityA1 = instanceA.entityManager.createEntity('Entity A1');
      const entityA2 = instanceA.entityManager.createEntity('Entity A2');
      const entityB1 = instanceB.entityManager.createEntity('Entity B1');

      // Delete entity from instance A
      instanceA.entityManager.deleteEntity(entityA1.id);

      expect(instanceA.entityManager.getEntityCount()).toBe(1);
      expect(instanceB.entityManager.getEntityCount()).toBe(1);
      expect(instanceA.entityManager.getEntity(entityA1.id)).toBeUndefined();
      expect(instanceA.entityManager.getEntity(entityA2.id)).toBeDefined();
      expect(instanceB.entityManager.getEntity(entityB1.id)).toBeDefined();
    });
  });

  describe('Component Isolation', () => {
    it('should maintain separate component data', () => {
      const entityA = instanceA.entityManager.createEntity('Entity A');
      const entityB = instanceB.entityManager.createEntity('Entity B');

      // Add transform components with different data
      instanceA.componentManager.addComponent(entityA.id, 'Transform', {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      instanceB.componentManager.addComponent(entityB.id, 'Transform', {
        position: [4, 5, 6],
        rotation: [0, 0, 0],
        scale: [2, 2, 2],
      });

      const transformA = instanceA.componentManager.getComponentData(entityA.id, 'Transform');
      const transformB = instanceB.componentManager.getComponentData(entityB.id, 'Transform');

      expect(transformA?.position).toEqual([1, 2, 3]);
      expect(transformB?.position).toEqual([4, 5, 6]);
      expect(transformB?.scale).toEqual([2, 2, 2]);
    });

    it('should handle component queries independently', () => {
      // Create entities with transforms in instance A
      const entityA1 = instanceA.entityManager.createEntity('Entity A1');
      const entityA2 = instanceA.entityManager.createEntity('Entity A2');
      instanceA.componentManager.addComponent(entityA1.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      instanceA.componentManager.addComponent(entityA2.id, 'Transform', {
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      // Create entity with transform in instance B
      const entityB1 = instanceB.entityManager.createEntity('Entity B1');
      instanceB.componentManager.addComponent(entityB1.id, 'Transform', {
        position: [2, 2, 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const entitiesWithTransformA =
        instanceA.componentManager.getEntitiesWithComponent('Transform');
      const entitiesWithTransformB =
        instanceB.componentManager.getEntitiesWithComponent('Transform');

      expect(entitiesWithTransformA).toHaveLength(2);
      expect(entitiesWithTransformB).toHaveLength(1);
      expect(entitiesWithTransformA).toContain(entityA1.id);
      expect(entitiesWithTransformA).toContain(entityA2.id);
      expect(entitiesWithTransformB).toContain(entityB1.id);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on dispose', () => {
      const entity = instanceA.entityManager.createEntity('Test Entity');
      instanceA.componentManager.addComponent(entity.id, 'Transform', {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      expect(instanceA.entityManager.getEntityCount()).toBe(1);
      expect(instanceA.componentManager.getEntitiesWithComponent('Transform')).toHaveLength(1);

      instanceA.dispose();

      // After disposal, container should be cleared
      expect(instanceA.container.has('ECSWorld')).toBe(false);
      expect(instanceA.container.has('EntityManager')).toBe(false);
      expect(instanceA.container.has('ComponentManager')).toBe(false);
    });

    it('should not affect other instances when one is disposed', () => {
      const entityA = instanceA.entityManager.createEntity('Entity A');
      const entityB = instanceB.entityManager.createEntity('Entity B');

      instanceA.dispose();

      // Instance B should still work
      expect(instanceB.entityManager.getEntityCount()).toBe(1);
      expect(instanceB.entityManager.getEntity(entityB.id)).toBeDefined();
    });
  });

  describe('Container Service Resolution', () => {
    it('should resolve services from container', () => {
      const worldFromContainer = instanceA.container.resolve('ECSWorld');
      const entityManagerFromContainer = instanceA.container.resolve('EntityManager');
      const componentManagerFromContainer = instanceA.container.resolve('ComponentManager');

      expect(worldFromContainer).toBe(instanceA.world);
      expect(entityManagerFromContainer).toBe(instanceA.entityManager);
      expect(componentManagerFromContainer).toBe(instanceA.componentManager);
    });

    it('should have separate service containers', () => {
      const worldA = instanceA.container.resolve('ECSWorld');
      const worldB = instanceB.container.resolve('ECSWorld');

      expect(worldA).not.toBe(worldB);
    });
  });

  describe('Hierarchy and Relationships', () => {
    it('should maintain parent-child relationships within instances', () => {
      const parent = instanceA.entityManager.createEntity('Parent');
      const child = instanceA.entityManager.createEntity('Child', parent.id);

      expect(child.parentId).toBe(parent.id);
      expect(parent.children).toContain(child.id);

      const retrievedParent = instanceA.entityManager.getParent(child.id);
      const retrievedChildren = instanceA.entityManager.getChildren(parent.id);

      expect(retrievedParent?.id).toBe(parent.id);
      expect(retrievedChildren).toHaveLength(1);
      expect(retrievedChildren[0].id).toBe(child.id);
    });

    it('should not share hierarchy between instances', () => {
      const parentA = instanceA.entityManager.createEntity('Parent A');
      const childA = instanceA.entityManager.createEntity('Child A', parentA.id);

      const parentB = instanceB.entityManager.createEntity('Parent B');
      const childB = instanceB.entityManager.createEntity('Child B', parentB.id);

      // Check that hierarchies are isolated
      expect(instanceA.entityManager.getChildren(parentA.id)).toHaveLength(1);
      expect(instanceB.entityManager.getChildren(parentB.id)).toHaveLength(1);

      expect(instanceA.entityManager.getParent(childA.id)?.id).toBe(parentA.id);
      expect(instanceB.entityManager.getParent(childB.id)?.id).toBe(parentB.id);
    });
  });
});

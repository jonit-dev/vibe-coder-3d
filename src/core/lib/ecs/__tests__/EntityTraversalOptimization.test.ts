import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EntityManager } from '../EntityManager';
import { ComponentManager } from '../ComponentManager';
import { EntityQueries } from '../queries/entityQueries';
import { ECSWorld } from '../World';
import { componentRegistry } from '../ComponentRegistry';
import { initializeCoreECS } from '../init';

describe('Entity Traversal Optimization Integration', () => {
  let entityManager: EntityManager;
  let componentManager: ComponentManager;
  let queries: EntityQueries;

  beforeEach(() => {
    // Reset world and managers
    ECSWorld.getInstance().reset();

    // Reset managers after world reset
    EntityManager.getInstance().reset();
    ComponentManager.getInstance().reset();
    componentRegistry.reset();

    // Reset queries instead of destroy/recreate
    try {
      EntityQueries.getInstance().reset();
    } catch (e) {
      // Ignore if not initialized
    }

    // Re-initialize core components after reset
    initializeCoreECS();

    entityManager = EntityManager.getInstance();
    componentManager = ComponentManager.getInstance();
    queries = EntityQueries.getInstance();
  });

  afterEach(() => {
    // Clean up
    queries.destroy();
  });

  describe('entity operations', () => {
    it('should maintain index consistency during entity lifecycle', () => {
      // Create entities
      const root1 = entityManager.createEntity('Root1');
      const root2 = entityManager.createEntity('Root2');
      const child1 = entityManager.createEntity('Child1', root1.id);
      const child2 = entityManager.createEntity('Child2', root1.id);
      const grandchild = entityManager.createEntity('Grandchild', child1.id);

      // Test getAllEntities efficiency - should use index instead of scanning
      const allEntities = entityManager.getAllEntities();
      expect(allEntities).toHaveLength(5);

      // Test indexed entity queries
      const indexedEntities = queries.listAllEntities();
      expect(indexedEntities.sort()).toEqual([root1.id, root2.id, child1.id, child2.id, grandchild.id].sort());

      // Test hierarchy queries
      const rootEntities = queries.getRootEntities();
      expect(rootEntities.sort()).toEqual([root1.id, root2.id].sort());

      const root1Children = queries.getChildren(root1.id);
      expect(root1Children.sort()).toEqual([child1.id, child2.id].sort());

      const descendants = queries.getDescendants(root1.id);
      expect(descendants.sort()).toEqual([child1.id, child2.id, grandchild.id].sort());

      // Test entity deletion and index maintenance
      entityManager.deleteEntity(child1.id);

      const afterDeletionEntities = queries.listAllEntities();
      expect(afterDeletionEntities).toHaveLength(3); // grandchild should also be deleted
      expect(afterDeletionEntities).not.toContain(child1.id);
      expect(afterDeletionEntities).not.toContain(grandchild.id);

      const afterDeletionChildren = queries.getChildren(root1.id);
      expect(afterDeletionChildren).toEqual([child2.id]);
    });

    it('should handle parent changes efficiently', () => {
      const root1 = entityManager.createEntity('Root1');
      const root2 = entityManager.createEntity('Root2');
      const child = entityManager.createEntity('Child', root1.id);

      expect(queries.getParent(child.id)).toBe(root1.id);
      expect(queries.getChildren(root1.id)).toEqual([child.id]);
      expect(queries.getChildren(root2.id)).toEqual([]);

      // Change parent
      entityManager.setParent(child.id, root2.id);

      expect(queries.getParent(child.id)).toBe(root2.id);
      expect(queries.getChildren(root1.id)).toEqual([]);
      expect(queries.getChildren(root2.id)).toEqual([child.id]);

      // Remove parent (make root)
      entityManager.setParent(child.id, undefined);

      expect(queries.getParent(child.id)).toBeUndefined();
      expect(queries.getChildren(root2.id)).toEqual([]);
      expect(queries.getRootEntities()).toContain(child.id);
    });
  });

  describe('component operations', () => {
    it('should maintain component index consistency', () => {
      const entity1 = entityManager.createEntity('Entity1');
      const entity2 = entityManager.createEntity('Entity2');
      const entity3 = entityManager.createEntity('Entity3');

      // Add components
      componentManager.addComponent(entity1.id, 'Transform', { position: [0, 0, 0] });
      componentManager.addComponent(entity1.id, 'MeshRenderer', { material: 'default' });
      componentManager.addComponent(entity2.id, 'Transform', { position: [1, 1, 1] });
      componentManager.addComponent(entity3.id, 'MeshRenderer', { material: 'special' });

      // Test efficient component queries (should use index instead of scanning)
      const transformEntities = componentManager.getEntitiesWithComponent('Transform');
      expect(transformEntities.sort()).toEqual([entity1.id, entity2.id].sort());

      const meshRendererEntities = componentManager.getEntitiesWithComponent('MeshRenderer');
      expect(meshRendererEntities.sort()).toEqual([entity1.id, entity3.id].sort());

      // Test multi-component queries
      const bothComponents = componentManager.getEntitiesWithComponents(['Transform', 'MeshRenderer']);
      expect(bothComponents).toEqual([entity1.id]);

      // Test direct index queries
      const indexedTransformEntities = queries.listEntitiesWithComponent('Transform');
      expect(indexedTransformEntities.sort()).toEqual([entity1.id, entity2.id].sort());

      const indexedBothComponents = queries.listEntitiesWithComponents(['Transform', 'MeshRenderer']);
      expect(indexedBothComponents).toEqual([entity1.id]);

      // Test component removal
      componentManager.removeComponent(entity1.id, 'MeshRenderer');

      const afterRemovalMeshEntities = queries.listEntitiesWithComponent('MeshRenderer');
      expect(afterRemovalMeshEntities).toEqual([entity3.id]);

      const afterRemovalBothComponents = queries.listEntitiesWithComponents(['Transform', 'MeshRenderer']);
      expect(afterRemovalBothComponents).toEqual([]);
    });

    it('should handle component queries with multiple types efficiently', () => {
      const entities = [];

      // Create test scenario with various component combinations
      for (let i = 0; i < 10; i++) {
        entities.push(entityManager.createEntity(`Entity${i}`));
      }

      // Entity patterns:
      // 0-4: Have Transform
      // 2-6: Have MeshRenderer
      // 4-8: Have RigidBody
      // So: 4 has all three, 2 has Transform+MeshRenderer, 6 has MeshRenderer+RigidBody

      for (let i = 0; i <= 4; i++) {
        componentManager.addComponent(entities[i].id, 'Transform', { position: [i, i, i] });
      }

      for (let i = 2; i <= 6; i++) {
        componentManager.addComponent(entities[i].id, 'MeshRenderer', { material: `mat${i}` });
      }

      for (let i = 4; i <= 8; i++) {
        componentManager.addComponent(entities[i].id, 'RigidBody', { mass: i });
      }

      // Test various multi-component queries
      const transformAndMesh = queries.listEntitiesWithComponents(['Transform', 'MeshRenderer']);
      expect(transformAndMesh.sort()).toEqual([entities[2].id, entities[3].id, entities[4].id].sort());

      const meshAndRigid = queries.listEntitiesWithComponents(['MeshRenderer', 'RigidBody']);
      expect(meshAndRigid.sort()).toEqual([entities[4].id, entities[5].id, entities[6].id].sort());

      const allThree = queries.listEntitiesWithComponents(['Transform', 'MeshRenderer', 'RigidBody']);
      expect(allThree).toEqual([entities[4].id]);

      const anyOfTwo = queries.listEntitiesWithAnyComponent(['Transform', 'RigidBody']);
      const expectedAny = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => entities[i].id);
      expect(anyOfTwo.sort()).toEqual(expectedAny.sort());
    });
  });

  describe('performance characteristics', () => {
    it('should handle large entity sets efficiently', () => {
      const startTime = performance.now();

      // Create many entities with hierarchy
      const entities = [];
      for (let i = 0; i < 100; i++) {
        const entity = entityManager.createEntity(`Entity${i}`, i > 0 ? entities[0].id : undefined);
        entities.push(entity);

        // Add components to create realistic load
        componentManager.addComponent(entity.id, 'Transform', { position: [i, i, i] });
        if (i % 3 === 0) {
          componentManager.addComponent(entity.id, 'MeshRenderer', { material: `mat${i}` });
        }
        if (i % 5 === 0) {
          componentManager.addComponent(entity.id, 'RigidBody', { mass: i });
        }
      }

      const creationTime = performance.now() - startTime;

      // Test that queries are fast (should be much faster than O(n) scans)
      const queryStartTime = performance.now();

      const allEntities = queries.listAllEntities();
      const rootEntities = queries.getRootEntities();
      const transformEntities = queries.listEntitiesWithComponent('Transform');
      const meshEntities = queries.listEntitiesWithComponent('MeshRenderer');
      const bothComponents = queries.listEntitiesWithComponents(['Transform', 'MeshRenderer']);
      const descendants = queries.getDescendants(entities[0].id);

      const queryTime = performance.now() - queryStartTime;

      // Verify correctness
      expect(allEntities).toHaveLength(100);
      expect(rootEntities).toHaveLength(1);
      expect(transformEntities).toHaveLength(100);
      expect(meshEntities).toHaveLength(34); // Every 3rd entity (0, 3, 6, ..., 99)
      expect(bothComponents).toHaveLength(34);
      expect(descendants).toHaveLength(99); // All except root

      // Query time should be much smaller than creation time
      // (creation involves event processing, query should be just index access)
      expect(queryTime).toBeLessThan(creationTime / 10);

      console.log(`Performance test: Created 100 entities in ${creationTime.toFixed(2)}ms, queries took ${queryTime.toFixed(2)}ms`);
    });

    it('should maintain consistency under rapid changes', async () => {
      const entities = [];

      // Create base entities
      for (let i = 0; i < 20; i++) {
        entities.push(entityManager.createEntity(`Entity${i}`));
      }

      // Rapidly add/remove components and change hierarchy
      for (let iteration = 0; iteration < 10; iteration++) {
        // Add components
        entities.forEach((entity, index) => {
          if (Math.random() > 0.5) {
            componentManager.addComponent(entity.id, 'Transform', { position: [index, iteration, 0] });
          }
          if (Math.random() > 0.7) {
            componentManager.addComponent(entity.id, 'MeshRenderer', { material: `mat${iteration}` });
          }
        });

        // Change some parent relationships
        for (let i = 1; i < entities.length; i++) {
          if (Math.random() > 0.8) {
            const newParent = entities[Math.floor(Math.random() * i)];
            entityManager.setParent(entities[i].id, newParent.id);
          }
        }

        // Remove some components
        entities.forEach(entity => {
          if (Math.random() > 0.6) {
            componentManager.removeComponent(entity.id, 'MeshRenderer');
          }
        });

        // Verify consistency after each iteration
        const report = await queries.checkConsistency();
        expect(report.isConsistent).toBe(true);
        if (!report.isConsistent) {
          console.error('Consistency check failed:', report.errors);
        }
      }
    });
  });

  describe('consistency validation', () => {
    it('should detect and report consistency issues', async () => {
      const entity1 = entityManager.createEntity('Entity1');
      const entity2 = entityManager.createEntity('Entity2', entity1.id);

      componentManager.addComponent(entity1.id, 'Transform', { position: [0, 0, 0] });
      componentManager.addComponent(entity2.id, 'MeshRenderer', { material: 'test' });

      // Normal case should be consistent
      const report1 = await queries.checkConsistency();
      expect(report1.isConsistent).toBe(true);
      expect(report1.errors).toHaveLength(0);

      // Verify statistics are correct
      expect(report1.stats.entitiesInWorld).toBe(2);
      expect(report1.stats.entitiesInIndex).toBe(2);
      expect(report1.stats.componentTypes).toBeGreaterThan(0);
      expect(report1.stats.hierarchyRelationships).toBe(1);
    });

    it('should validate indices match ECS world state', async () => {
      // Create some entities and components
      const entities = [];
      for (let i = 0; i < 5; i++) {
        entities.push(entityManager.createEntity(`Entity${i}`));
        componentManager.addComponent(entities[i].id, 'Transform', { position: [i, i, i] });
      }

      // Set up hierarchy
      entityManager.setParent(entities[1].id, entities[0].id);
      entityManager.setParent(entities[2].id, entities[0].id);

      // Consistency should be maintained
      const errors = queries.validateIndices();
      expect(errors).toHaveLength(0);

      // Use development consistency checker
      await queries.assertConsistency(); // Should not throw
    });
  });

  describe('memory management', () => {
    it('should clean up indices when entities are cleared', () => {
      // Create entities and components
      for (let i = 0; i < 10; i++) {
        const entity = entityManager.createEntity(`Entity${i}`);
        componentManager.addComponent(entity.id, 'Transform', { position: [i, i, i] });
      }

      expect(queries.listAllEntities()).toHaveLength(10);
      expect(queries.getComponentTypes()).toContain('Transform');

      // Clear all entities
      entityManager.clearEntities();

      expect(queries.listAllEntities()).toHaveLength(0);
      expect(queries.getComponentTypes()).toHaveLength(0);
    });

    it('should handle index rebuilding correctly', async () => {
      // Create initial state through normal operations
      const entities = [];
      for (let i = 0; i < 5; i++) {
        entities.push(entityManager.createEntity(`Entity${i}`));
        componentManager.addComponent(entities[i].id, 'Transform', { position: [i, i, i] });
      }
      entityManager.setParent(entities[1].id, entities[0].id);

      // Get state before rebuild
      const entitiesBefore = queries.listAllEntities();
      const transformEntitiesBefore = queries.listEntitiesWithComponent('Transform');
      const childrenBefore = queries.getChildren(entities[0].id);

      // Rebuild indices
      queries.rebuildIndices();

      // State should be identical after rebuild
      const entitiesAfter = queries.listAllEntities();
      const transformEntitiesAfter = queries.listEntitiesWithComponent('Transform');
      const childrenAfter = queries.getChildren(entities[0].id);

      expect(entitiesAfter.sort()).toEqual(entitiesBefore.sort());
      expect(transformEntitiesAfter.sort()).toEqual(transformEntitiesBefore.sort());
      expect(childrenAfter).toEqual(childrenBefore);

      // Consistency should be maintained
      const report = await queries.checkConsistency();
      expect(report.isConsistent).toBe(true);
    });
  });
});
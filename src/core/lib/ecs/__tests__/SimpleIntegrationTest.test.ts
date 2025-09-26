import { describe, it, expect, beforeEach } from 'vitest';
import { EntityIndex } from '../indexers/EntityIndex';
import { HierarchyIndex } from '../indexers/HierarchyIndex';
import { ComponentIndex } from '../indexers/ComponentIndex';

describe('Entity Traversal Optimization (Simple Integration)', () => {
  let entityIndex: EntityIndex;
  let hierarchyIndex: HierarchyIndex;
  let componentIndex: ComponentIndex;

  beforeEach(() => {
    entityIndex = new EntityIndex();
    hierarchyIndex = new HierarchyIndex();
    componentIndex = new ComponentIndex();
  });

  describe('index coordination', () => {
    it('should coordinate all indices correctly', () => {
      // Simulate entity creation
      const entityId1 = 1;
      const entityId2 = 2;
      const entityId3 = 3;

      // Add entities to entity index
      entityIndex.add(entityId1);
      entityIndex.add(entityId2);
      entityIndex.add(entityId3);

      // Set up hierarchy: 1 -> 2 -> 3
      hierarchyIndex.setParent(entityId2, entityId1);
      hierarchyIndex.setParent(entityId3, entityId2);

      // Add components
      componentIndex.onAdd('Transform', entityId1);
      componentIndex.onAdd('Transform', entityId2);
      componentIndex.onAdd('Transform', entityId3);
      componentIndex.onAdd('MeshRenderer', entityId1);
      componentIndex.onAdd('MeshRenderer', entityId3);

      // Test entity queries
      const allEntities = entityIndex.list();
      expect(allEntities.sort()).toEqual([1, 2, 3]);

      // Test hierarchy queries
      const rootEntities = hierarchyIndex.getRootEntities(allEntities);
      expect(rootEntities).toEqual([1]);

      const childrenOf1 = hierarchyIndex.getChildren(1);
      expect(childrenOf1).toEqual([2]);

      const descendantsOf1 = hierarchyIndex.getDescendants(1);
      expect(descendantsOf1.sort()).toEqual([2, 3]);

      // Test component queries
      const transformEntities = componentIndex.list('Transform');
      expect(transformEntities.sort()).toEqual([1, 2, 3]);

      const meshRendererEntities = componentIndex.list('MeshRenderer');
      expect(meshRendererEntities.sort()).toEqual([1, 3]);

      const bothComponents = componentIndex.listWithAllComponents(['Transform', 'MeshRenderer']);
      expect(bothComponents.sort()).toEqual([1, 3]);
    });

    it('should handle entity removal across all indices', () => {
      // Setup initial state
      entityIndex.add(1);
      entityIndex.add(2);
      entityIndex.add(3);

      hierarchyIndex.setParent(2, 1);
      hierarchyIndex.setParent(3, 2);

      componentIndex.onAdd('Transform', 1);
      componentIndex.onAdd('Transform', 2);
      componentIndex.onAdd('MeshRenderer', 2);

      // Remove entity 2
      entityIndex.delete(2);
      hierarchyIndex.removeEntity(2);
      componentIndex.removeEntity(2);

      // Verify state
      expect(entityIndex.list().sort()).toEqual([1, 3]);
      expect(hierarchyIndex.getChildren(1)).toEqual([]);
      expect(hierarchyIndex.getParent(3)).toBeUndefined();
      expect(componentIndex.list('Transform')).toEqual([1]);
      expect(componentIndex.list('MeshRenderer')).toEqual([]);
    });

    it('should perform efficiently with many entities', () => {
      // Add many entities
      const entityCount = 1000;
      for (let i = 1; i <= entityCount; i++) {
        entityIndex.add(i);
        componentIndex.onAdd('Transform', i);

        if (i % 2 === 0) {
          componentIndex.onAdd('MeshRenderer', i);
        }

        if (i > 1) {
          hierarchyIndex.setParent(i, 1); // All children of entity 1
        }
      }

      // Test performance
      const startTime = performance.now();

      const allEntities = entityIndex.list();
      const transformEntities = componentIndex.list('Transform');
      const meshRendererEntities = componentIndex.list('MeshRenderer');
      const bothComponents = componentIndex.listWithAllComponents(['Transform', 'MeshRenderer']);
      const childrenOf1 = hierarchyIndex.getChildren(1);

      const endTime = performance.now();

      // Verify results
      expect(allEntities).toHaveLength(entityCount);
      expect(transformEntities).toHaveLength(entityCount);
      expect(meshRendererEntities).toHaveLength(entityCount / 2);
      expect(bothComponents).toHaveLength(entityCount / 2);
      expect(childrenOf1).toHaveLength(entityCount - 1);

      // Query time should be reasonable (much less than 100ms for 1000 entities)
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(100);

      console.log(`Performance test: ${entityCount} entities, queries took ${queryTime.toFixed(2)}ms`);
    });
  });

});
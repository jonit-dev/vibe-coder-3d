import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentIndex } from '../indexers/ComponentIndex';

describe('ComponentIndex', () => {
  let index: ComponentIndex;

  beforeEach(() => {
    index = new ComponentIndex();
  });

  describe('basic operations', () => {
    it('should add entities to component types', () => {
      index.onAdd('Transform', 1);
      index.onAdd('Transform', 2);
      index.onAdd('MeshRenderer', 1);

      expect(index.has('Transform', 1)).toBe(true);
      expect(index.has('Transform', 2)).toBe(true);
      expect(index.has('MeshRenderer', 1)).toBe(true);
      expect(index.has('MeshRenderer', 2)).toBe(false);
    });

    it('should remove entities from component types', () => {
      index.onAdd('Transform', 1);
      index.onAdd('Transform', 2);
      expect(index.has('Transform', 1)).toBe(true);

      index.onRemove('Transform', 1);
      expect(index.has('Transform', 1)).toBe(false);
      expect(index.has('Transform', 2)).toBe(true);
    });

    it('should list entities with specific component types', () => {
      index.onAdd('Transform', 1);
      index.onAdd('Transform', 3);
      index.onAdd('Transform', 5);
      index.onAdd('MeshRenderer', 1);
      index.onAdd('MeshRenderer', 2);

      const transformEntities = index.list('Transform');
      expect(transformEntities.sort()).toEqual([1, 3, 5]);

      const meshRendererEntities = index.list('MeshRenderer');
      expect(meshRendererEntities.sort()).toEqual([1, 2]);

      const nonExistentEntities = index.list('NonExistent');
      expect(nonExistentEntities).toEqual([]);
    });

    it('should get component counts', () => {
      expect(index.getCount('Transform')).toBe(0);

      index.onAdd('Transform', 1);
      index.onAdd('Transform', 2);
      expect(index.getCount('Transform')).toBe(2);

      index.onRemove('Transform', 1);
      expect(index.getCount('Transform')).toBe(1);
    });

    it('should get all component types', () => {
      expect(index.getComponentTypes()).toEqual([]);

      index.onAdd('Transform', 1);
      index.onAdd('MeshRenderer', 2);
      index.onAdd('RigidBody', 3);

      const types = index.getComponentTypes().sort();
      expect(types).toEqual(['MeshRenderer', 'RigidBody', 'Transform']);
    });
  });

  describe('multi-component queries', () => {
    beforeEach(() => {
      // Setup test data:
      // Entity 1: Transform, MeshRenderer
      // Entity 2: Transform, RigidBody
      // Entity 3: Transform, MeshRenderer, RigidBody
      // Entity 4: MeshRenderer
      // Entity 5: RigidBody
      index.onAdd('Transform', 1);
      index.onAdd('MeshRenderer', 1);

      index.onAdd('Transform', 2);
      index.onAdd('RigidBody', 2);

      index.onAdd('Transform', 3);
      index.onAdd('MeshRenderer', 3);
      index.onAdd('RigidBody', 3);

      index.onAdd('MeshRenderer', 4);

      index.onAdd('RigidBody', 5);
    });

    it('should find entities with all specified components', () => {
      const transformAndMesh = index.listWithAllComponents(['Transform', 'MeshRenderer']);
      expect(transformAndMesh.sort()).toEqual([1, 3]);

      const transformAndRigid = index.listWithAllComponents(['Transform', 'RigidBody']);
      expect(transformAndRigid.sort()).toEqual([2, 3]);

      const allThree = index.listWithAllComponents(['Transform', 'MeshRenderer', 'RigidBody']);
      expect(allThree).toEqual([3]);

      const nonExistent = index.listWithAllComponents(['Transform', 'NonExistent']);
      expect(nonExistent).toEqual([]);
    });

    it('should optimize multi-component queries by starting with smallest set', () => {
      // RigidBody has fewer entities (2, 3, 5) than Transform (1, 2, 3)
      // The algorithm should start with RigidBody for better performance
      const result = index.listWithAllComponents(['Transform', 'RigidBody']);
      expect(result.sort()).toEqual([2, 3]);

      // Order shouldn't matter for results
      const resultReversed = index.listWithAllComponents(['RigidBody', 'Transform']);
      expect(resultReversed.sort()).toEqual([2, 3]);
    });

    it('should find entities with any of the specified components', () => {
      const meshOrRigid = index.listWithAnyComponent(['MeshRenderer', 'RigidBody']);
      expect(meshOrRigid.sort()).toEqual([1, 2, 3, 4, 5]);

      const transformOrNonExistent = index.listWithAnyComponent(['Transform', 'NonExistent']);
      expect(transformOrNonExistent.sort()).toEqual([1, 2, 3]);

      const nonExistent = index.listWithAnyComponent(['NonExistent', 'AlsoNonExistent']);
      expect(nonExistent).toEqual([]);
    });

    it('should handle single component queries efficiently', () => {
      const single = index.listWithAllComponents(['Transform']);
      expect(single.sort()).toEqual([1, 2, 3]);

      const singleAny = index.listWithAnyComponent(['Transform']);
      expect(singleAny.sort()).toEqual([1, 2, 3]);
    });

    it('should handle empty component lists', () => {
      expect(index.listWithAllComponents([])).toEqual([]);
      expect(index.listWithAnyComponent([])).toEqual([]);
    });
  });

  describe('entity management', () => {
    it('should remove entity from all component types', () => {
      index.onAdd('Transform', 1);
      index.onAdd('MeshRenderer', 1);
      index.onAdd('RigidBody', 1);

      expect(index.has('Transform', 1)).toBe(true);
      expect(index.has('MeshRenderer', 1)).toBe(true);
      expect(index.has('RigidBody', 1)).toBe(true);

      index.removeEntity(1);

      expect(index.has('Transform', 1)).toBe(false);
      expect(index.has('MeshRenderer', 1)).toBe(false);
      expect(index.has('RigidBody', 1)).toBe(false);
    });

    it('should clean up empty component types when removing entities', () => {
      index.onAdd('Transform', 1);
      expect(index.getComponentTypes()).toContain('Transform');

      index.removeEntity(1);
      expect(index.getComponentTypes()).not.toContain('Transform');
    });

    it('should clear all component memberships', () => {
      index.onAdd('Transform', 1);
      index.onAdd('MeshRenderer', 2);
      index.onAdd('RigidBody', 3);

      expect(index.getComponentTypes()).toHaveLength(3);
      expect(index.getTotalComponentCount()).toBe(3);

      index.clear();

      expect(index.getComponentTypes()).toEqual([]);
      expect(index.getTotalComponentCount()).toBe(0);
    });
  });

  describe('performance characteristics', () => {
    it('should handle duplicate additions efficiently', () => {
      index.onAdd('Transform', 1);
      index.onAdd('Transform', 1);
      index.onAdd('Transform', 1);

      expect(index.getCount('Transform')).toBe(1);
      expect(index.list('Transform')).toEqual([1]);
    });

    it('should handle removal of non-existent entities', () => {
      index.onRemove('Transform', 999);
      expect(index.getCount('Transform')).toBe(0);

      index.onAdd('Transform', 1);
      index.onRemove('Transform', 999);
      expect(index.getCount('Transform')).toBe(1);
    });

    it('should handle large numbers of entities efficiently', () => {
      // Add 1000 entities to Transform component
      for (let i = 1; i <= 1000; i++) {
        index.onAdd('Transform', i);
      }

      expect(index.getCount('Transform')).toBe(1000);
      expect(index.has('Transform', 500)).toBe(true);
      expect(index.has('Transform', 1000)).toBe(true);
      expect(index.has('Transform', 1001)).toBe(false);

      // Multi-component query performance
      for (let i = 1; i <= 500; i++) {
        index.onAdd('MeshRenderer', i);
      }

      const both = index.listWithAllComponents(['Transform', 'MeshRenderer']);
      expect(both).toHaveLength(500);
    });

    it('should optimize set intersection for multi-component queries', () => {
      // Create unbalanced component distributions
      // Many entities with Transform, few with SpecialComponent
      for (let i = 1; i <= 1000; i++) {
        index.onAdd('Transform', i);
      }
      for (let i = 1; i <= 5; i++) {
        index.onAdd('SpecialComponent', i);
      }

      // Query should start with the smaller set (SpecialComponent)
      const result = index.listWithAllComponents(['Transform', 'SpecialComponent']);
      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('total component count', () => {
    it('should calculate total component instances', () => {
      expect(index.getTotalComponentCount()).toBe(0);

      index.onAdd('Transform', 1);
      index.onAdd('Transform', 2);
      index.onAdd('MeshRenderer', 1);
      index.onAdd('RigidBody', 3);

      // 2 Transform + 1 MeshRenderer + 1 RigidBody = 4 total
      expect(index.getTotalComponentCount()).toBe(4);
    });

    it('should update total count when components are removed', () => {
      index.onAdd('Transform', 1);
      index.onAdd('MeshRenderer', 1);
      expect(index.getTotalComponentCount()).toBe(2);

      index.onRemove('Transform', 1);
      expect(index.getTotalComponentCount()).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle component type names with special characters', () => {
      const specialName = 'Component.With.Dots_And-Dashes';
      index.onAdd(specialName, 1);

      expect(index.has(specialName, 1)).toBe(true);
      expect(index.list(specialName)).toEqual([1]);
      expect(index.getComponentTypes()).toContain(specialName);
    });

    it('should handle entity ID 0', () => {
      index.onAdd('Transform', 0);
      expect(index.has('Transform', 0)).toBe(true);
      expect(index.list('Transform')).toContain(0);
    });

    it('should handle empty component type strings', () => {
      index.onAdd('', 1);
      expect(index.has('', 1)).toBe(true);
      expect(index.getComponentTypes()).toContain('');
    });
  });
});
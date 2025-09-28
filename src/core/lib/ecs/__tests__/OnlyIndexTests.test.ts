import { describe, it, expect } from 'vitest';

// Test only the index classes without any dependencies
describe('Index Classes (Isolated)', () => {
  describe('EntityIndex', () => {
    it('should add and check entity existence', async () => {
      const { EntityIndex } = await import('../indexers/EntityIndex');
      const index = new EntityIndex();

      index.add(1);
      expect(index.has(1)).toBe(true);
      expect(index.has(2)).toBe(false);
    });

    it('should list entities', async () => {
      const { EntityIndex } = await import('../indexers/EntityIndex');
      const index = new EntityIndex();

      index.add(1);
      index.add(2);
      const entities = index.list();
      expect(entities.sort()).toEqual([1, 2]);
    });
  });

  describe('HierarchyIndex', () => {
    it('should set and get parent relationships', async () => {
      const { HierarchyIndex } = await import('../indexers/HierarchyIndex');
      const index = new HierarchyIndex();

      index.setParent(2, 1);
      expect(index.getParent(2)).toBe(1);
      expect(index.getChildren(1)).toEqual([2]);
    });
  });

  describe('ComponentIndex', () => {
    it('should add entities to component types', async () => {
      const { ComponentIndex } = await import('../indexers/ComponentIndex');
      const index = new ComponentIndex();

      index.onAdd('Transform', 1);
      expect(index.has('Transform', 1)).toBe(true);
      expect(index.list('Transform')).toEqual([1]);
    });
  });
});
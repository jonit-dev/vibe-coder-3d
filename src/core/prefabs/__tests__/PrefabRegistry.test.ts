import { describe, it, expect, beforeEach } from 'vitest';
import { PrefabRegistry } from '../PrefabRegistry';
import type { IPrefabDefinition } from '../Prefab.types';

describe('PrefabRegistry', () => {
  let registry: PrefabRegistry;

  beforeEach(() => {
    registry = new PrefabRegistry();
    registry.clear();
  });

  const createTestPrefab = (id: string, deps: string[] = []): IPrefabDefinition => ({
    id,
    name: `Test Prefab ${id}`,
    version: 1,
    root: {
      name: 'Root',
      components: { Transform: { position: [0, 0, 0] } },
    },
    dependencies: deps,
    tags: ['test'],
    metadata: {},
  });

  describe('basic CRUD operations', () => {
    it('should register and retrieve a prefab', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);

      const retrieved = registry.get('test1');
      expect(retrieved).toEqual(prefab);
    });

    it('should list all prefabs', () => {
      const prefab1 = createTestPrefab('test1');
      const prefab2 = createTestPrefab('test2');

      registry.upsert(prefab1);
      registry.upsert(prefab2);

      const all = registry.list();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(prefab1);
      expect(all).toContainEqual(prefab2);
    });

    it('should update existing prefab', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);

      const updated = { ...prefab, name: 'Updated Name', version: 2 };
      registry.upsert(updated);

      const retrieved = registry.get('test1');
      expect(retrieved?.name).toBe('Updated Name');
      expect(retrieved?.version).toBe(2);
    });

    it('should remove a prefab', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);
      expect(registry.get('test1')).toBeDefined();

      registry.remove('test1');
      expect(registry.get('test1')).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('should reject prefab with empty ID', () => {
      const prefab = createTestPrefab('');
      expect(() => registry.upsert(prefab)).toThrow();
    });

    it('should reject prefab with empty name', () => {
      const prefab = createTestPrefab('test1');
      prefab.name = '';
      expect(() => registry.upsert(prefab)).toThrow();
    });

    it('should reject prefab with version < 1', () => {
      const prefab = createTestPrefab('test1');
      prefab.version = 0;
      expect(() => registry.upsert(prefab)).toThrow();
    });
  });

  describe('circular dependency detection', () => {
    it('should detect direct circular dependency', () => {
      const prefab = createTestPrefab('test1', ['test1']);
      expect(() => registry.upsert(prefab)).toThrow(/depend on itself/i);
    });

    it('should detect indirect circular dependency', () => {
      const prefab1 = createTestPrefab('test1', ['test2']);
      const prefab2 = createTestPrefab('test2', ['test3']);
      const prefab3 = createTestPrefab('test3', ['test1']);

      registry.upsert(prefab1);
      registry.upsert(prefab2);
      expect(() => registry.upsert(prefab3)).toThrow(/circular/i);
    });

    it('should allow valid dependency chains', () => {
      const prefab1 = createTestPrefab('test1', ['test2']);
      const prefab2 = createTestPrefab('test2', ['test3']);
      const prefab3 = createTestPrefab('test3', []);

      expect(() => {
        registry.upsert(prefab1);
        registry.upsert(prefab2);
        registry.upsert(prefab3);
      }).not.toThrow();
    });
  });

  describe('dependencies', () => {
    it('should prevent deletion of prefab with dependents', () => {
      const prefab1 = createTestPrefab('test1', []);
      const prefab2 = createTestPrefab('test2', ['test1']);

      registry.upsert(prefab1);
      registry.upsert(prefab2);

      expect(() => registry.remove('test1')).toThrow();
    });

    it('should find dependents', () => {
      const prefab1 = createTestPrefab('test1', []);
      const prefab2 = createTestPrefab('test2', ['test1']);
      const prefab3 = createTestPrefab('test3', ['test1']);

      registry.upsert(prefab1);
      registry.upsert(prefab2);
      registry.upsert(prefab3);

      const dependents = registry.findDependents('test1');
      expect(dependents).toHaveLength(2);
      expect(dependents.map((p) => p.id)).toContain('test2');
      expect(dependents.map((p) => p.id)).toContain('test3');
    });
  });

  describe('search and filtering', () => {
    beforeEach(() => {
      registry.upsert(createTestPrefab('cube'));
      registry.upsert({
        ...createTestPrefab('sphere'),
        name: 'Sphere Object',
        tags: ['geometry', 'primitive'],
      });
      registry.upsert({
        ...createTestPrefab('player'),
        name: 'Player Character',
        tags: ['character', 'controllable'],
        description: 'Main player entity',
      });
    });

    it('should search by name', () => {
      const results = registry.search('sphere');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sphere');
    });

    it('should search by ID', () => {
      const results = registry.search('player');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('player');
    });

    it('should search by tag', () => {
      const results = registry.search('geometry');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sphere');
    });

    it('should search by description', () => {
      const results = registry.search('main');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('player');
    });

    it('should be case-insensitive', () => {
      const results = registry.search('SPHERE');
      expect(results).toHaveLength(1);
    });

    it('should filter by tags', () => {
      const results = registry.filterByTags(['primitive']);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sphere');
    });

    it('should filter by multiple tags (OR)', () => {
      const results = registry.filterByTags(['primitive', 'character']);
      expect(results).toHaveLength(2);
    });
  });

  describe('variants', () => {
    it('should register and retrieve variants', () => {
      const base = createTestPrefab('base');
      registry.upsert(base);

      const variant = {
        id: 'variant1',
        baseId: 'base',
        name: 'Variant 1',
        version: 1,
        patch: { color: 'red' },
      };

      registry.upsertVariant(variant);

      const retrieved = registry.getVariant('variant1');
      expect(retrieved).toEqual(variant);
    });

    it('should reject variant without base prefab', () => {
      const variant = {
        id: 'variant1',
        baseId: 'nonexistent',
        name: 'Variant 1',
        version: 1,
      };

      expect(() => registry.upsertVariant(variant)).toThrow();
    });

    it('should get all variants of a base', () => {
      const base = createTestPrefab('base');
      registry.upsert(base);

      registry.upsertVariant({
        id: 'variant1',
        baseId: 'base',
        name: 'Variant 1',
        version: 1,
      });

      registry.upsertVariant({
        id: 'variant2',
        baseId: 'base',
        name: 'Variant 2',
        version: 1,
      });

      const variants = registry.getVariantsOf('base');
      expect(variants).toHaveLength(2);
    });
  });

  describe('hashing', () => {
    it('should generate consistent hash for prefab', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);

      const hash1 = registry.getHash('test1');
      const hash2 = registry.getHash('test1');

      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
    });

    it('should change hash when prefab is updated', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);

      const hash1 = registry.getHash('test1');

      const updated = {
        ...prefab,
        root: { ...prefab.root, name: 'Changed' },
        version: 2,
      };
      registry.upsert(updated);

      const hash2 = registry.getHash('test1');

      expect(hash1).not.toBe(hash2);
    });

    it('should detect changes via hash', () => {
      const prefab = createTestPrefab('test1');
      registry.upsert(prefab);

      const hash = registry.getHash('test1')!;
      expect(registry.hasChanged('test1', hash)).toBe(false);

      const updated = { ...prefab, version: 2 };
      registry.upsert(updated);

      expect(registry.hasChanged('test1', hash)).toBe(true);
    });
  });

  describe('statistics', () => {
    it('should return correct stats', () => {
      const prefab1 = createTestPrefab('test1', ['dep1', 'dep2']);
      const prefab2 = createTestPrefab('test2', ['dep3']);

      registry.upsert(prefab1);
      registry.upsert(prefab2);

      registry.upsertVariant({
        id: 'variant1',
        baseId: 'test1',
        name: 'Variant',
        version: 1,
      });

      const stats = registry.getStats();

      expect(stats.prefabCount).toBe(2);
      expect(stats.variantCount).toBe(1);
      expect(stats.totalDependencies).toBe(3);
    });
  });
});

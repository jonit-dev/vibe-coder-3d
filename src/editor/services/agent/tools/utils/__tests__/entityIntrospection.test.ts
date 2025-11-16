/**
 * Tests for Entity Introspection Utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEntitySummaries,
  getEntityDetail,
  getSceneStats,
  formatEntityList,
  formatSceneStats,
} from '../entityIntrospection';
import type { IEntitySummary, IEntityDetail, ISceneStats } from '../entityIntrospection';

// Mock dependencies
vi.mock('@core/lib/ecs/queries/entityQueries', () => {
  const mockQueries = {
    listAllEntities: vi.fn(() => [1, 2, 3]),
    listEntitiesWithComponent: vi.fn((component: string) => {
      if (component === 'Transform') return [1, 2];
      if (component === 'MeshRenderer') return [2];
      return [];
    }),
    getChildren: vi.fn((id: number) => {
      if (id === 1) return [2, 3];
      return [];
    }),
    getRootEntities: vi.fn(() => [1]),
    hasComponent: vi.fn((id: number, component: string) => {
      if (component === 'Transform' && (id === 1 || id === 2)) return true;
      if (component === 'MeshRenderer' && id === 2) return true;
      return false;
    }),
    getDepth: vi.fn((id: number) => {
      if (id === 1) return 0;
      if (id === 2) return 1;
      if (id === 3) return 1;
      return 0;
    }),
    getComponentCount: vi.fn((component: string) => {
      if (component === 'Transform') return 2;
      if (component === 'MeshRenderer') return 1;
      return 0;
    }),
  };

  return {
    EntityQueries: {
      getInstance: () => mockQueries,
    },
  };
});

vi.mock('@core/lib/ecs/ComponentRegistry', () => {
  const mockRegistry = {
    getEntityComponents: vi.fn((id: number) => {
      if (id === 1) return ['Transform'];
      if (id === 2) return ['Transform', 'MeshRenderer'];
      if (id === 3) return ['Transform'];
      return [];
    }),
    getComponentData: vi.fn((id: number, component: string) => {
      if (component === 'Transform' && id === 1) {
        return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
      }
      if (component === 'Transform' && id === 2) {
        return { position: [5, 2, 3], rotation: [0, 45, 0], scale: [1, 1, 1] };
      }
      if (component === 'MeshRenderer' && id === 2) {
        return {
          geometry: 'box',
          material: { id: 'mat1', color: '#ff0000' },
        };
      }
      return null;
    }),
    listComponents: vi.fn(() => ['Transform', 'MeshRenderer']),
  };

  return {
    ComponentRegistry: {
      getInstance: () => mockRegistry,
    },
  };
});

vi.mock('@core/lib/ecs/DataConversion', () => ({
  getEntityName: vi.fn((id: number) => {
    if (id === 1) return 'Root';
    if (id === 2) return 'Box';
    if (id === 3) return 'Child';
    return `Entity_${id}`;
  }),
  getEntityParent: vi.fn((id: number) => {
    if (id === 2 || id === 3) return 1;
    return null;
  }),
}));

describe('entityIntrospection', () => {
  describe('getEntitySummaries', () => {
    it('should return summaries for all entities', () => {
      const summaries = getEntitySummaries();

      expect(summaries).toHaveLength(3);
      expect(summaries[0]).toMatchObject({
        id: 1,
        name: 'Root',
        components: ['Transform'],
      });
    });

    it('should respect limit parameter', () => {
      const summaries = getEntitySummaries(2);

      expect(summaries).toHaveLength(2);
    });

    it('should filter by component type', () => {
      const summaries = getEntitySummaries(50, { component: 'MeshRenderer' });

      expect(summaries).toHaveLength(1);
      expect(summaries[0].id).toBe(2);
      expect(summaries[0].name).toBe('Box');
    });

    it('should filter by name substring', () => {
      const summaries = getEntitySummaries(50, { nameContains: 'box' });

      expect(summaries).toHaveLength(1);
      expect(summaries[0].name).toBe('Box');
    });

    it('should filter by parent ID', () => {
      const summaries = getEntitySummaries(50, { parentId: 1 });

      expect(summaries).toHaveLength(2);
      expect(summaries.map((s) => s.id)).toContain(2);
      expect(summaries.map((s) => s.id)).toContain(3);
    });

    it('should include transform data when available', () => {
      const summaries = getEntitySummaries(50);
      const rootSummary = summaries.find((s) => s.id === 1);

      expect(rootSummary?.transform).toEqual({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    });

    it('should include material data when available', () => {
      const summaries = getEntitySummaries(50);
      const boxSummary = summaries.find((s) => s.id === 2);

      expect(boxSummary?.material).toEqual({
        meshId: 'box',
        materialId: 'mat1',
        color: '#ff0000',
      });
    });

    it('should include parent reference when available', () => {
      const summaries = getEntitySummaries(50);
      const boxSummary = summaries.find((s) => s.id === 2);

      expect(boxSummary?.parent).toBe(1);
    });
  });

  describe('getEntityDetail', () => {
    it('should return detailed entity information', () => {
      const detail = getEntityDetail(2);

      expect(detail).toMatchObject({
        id: 2,
        name: 'Box',
        components: ['Transform', 'MeshRenderer'],
        depth: 1,
        parent: 1,
      });
    });

    it('should include all component data', () => {
      const detail = getEntityDetail(2);

      expect(detail?.allComponents).toHaveProperty('Transform');
      expect(detail?.allComponents).toHaveProperty('MeshRenderer');
    });

    it('should include children array', () => {
      const detail = getEntityDetail(1);

      expect(detail?.children).toEqual([2, 3]);
    });

    it('should return null for non-existent entity', () => {
      const detail = getEntityDetail(999);

      expect(detail).toBeNull();
    });
  });

  describe('getSceneStats', () => {
    it('should return scene statistics', () => {
      const stats = getSceneStats();

      expect(stats).toMatchObject({
        totalEntities: 3,
        rootEntities: 1,
        truncated: false,
      });
    });

    it('should include component counts', () => {
      const stats = getSceneStats();

      expect(stats.componentCounts).toEqual({
        Transform: 2,
        MeshRenderer: 1,
      });
    });

    it('should calculate scene bounds', () => {
      const stats = getSceneStats();

      expect(stats.bounds).toBeDefined();
      expect(stats.bounds?.min).toEqual([0, 0, 0]);
      expect(stats.bounds?.max).toEqual([5, 2, 3]);
    });
  });

  describe('formatEntityList', () => {
    it('should format empty list', () => {
      const formatted = formatEntityList([]);

      expect(formatted).toBe('No entities found in the scene.');
    });

    it('should format entity summaries', () => {
      const summaries: IEntitySummary[] = [
        {
          id: 1,
          name: 'Test',
          components: ['Transform'],
          transform: { position: [0, 1, 2] },
        },
      ];

      const formatted = formatEntityList(summaries);

      expect(formatted).toContain('Entity 1');
      expect(formatted).toContain('Test');
      expect(formatted).toContain('Transform');
      expect(formatted).toContain('Position: (0, 1, 2)');
    });

    it('should indicate truncation', () => {
      const summaries: IEntitySummary[] = [
        {
          id: 1,
          name: 'Test',
          components: [],
        },
      ];

      const formatted = formatEntityList(summaries, true);

      expect(formatted).toContain('truncated');
    });

    it('should include rotation and scale when available', () => {
      const summaries: IEntitySummary[] = [
        {
          id: 1,
          name: 'Test',
          components: ['Transform'],
          transform: {
            position: [0, 0, 0],
            rotation: [0, 45, 0],
            scale: [2, 2, 2],
          },
        },
      ];

      const formatted = formatEntityList(summaries);

      expect(formatted).toContain('Rotation: (0, 45, 0°)');
      expect(formatted).toContain('Scale: (2, 2, 2)');
    });

    it('should include material information', () => {
      const summaries: IEntitySummary[] = [
        {
          id: 1,
          name: 'Test',
          components: ['MeshRenderer'],
          material: {
            meshId: 'cube',
            materialId: 'mat1',
            color: '#ff0000',
          },
        },
      ];

      const formatted = formatEntityList(summaries);

      expect(formatted).toContain('Material:');
      expect(formatted).toContain('mesh: cube');
      expect(formatted).toContain('material: mat1');
      expect(formatted).toContain('color: #ff0000');
    });

    it('should include parent reference', () => {
      const summaries: IEntitySummary[] = [
        {
          id: 2,
          name: 'Child',
          components: [],
          parent: 1,
        },
      ];

      const formatted = formatEntityList(summaries);

      expect(formatted).toContain('Parent: Entity 1');
    });
  });

  describe('formatSceneStats', () => {
    it('should format scene statistics', () => {
      const stats: ISceneStats = {
        totalEntities: 10,
        rootEntities: 3,
        componentCounts: {
          Transform: 10,
          MeshRenderer: 5,
        },
        truncated: false,
      };

      const formatted = formatSceneStats(stats);

      expect(formatted).toContain('Total Entities: 10');
      expect(formatted).toContain('Root Entities: 3');
      expect(formatted).toContain('Transform: 10');
      expect(formatted).toContain('MeshRenderer: 5');
    });

    it('should include bounds when available', () => {
      const stats: ISceneStats = {
        totalEntities: 5,
        rootEntities: 1,
        componentCounts: {},
        truncated: false,
        bounds: {
          min: [-10, -5, -3],
          max: [10, 5, 3],
        },
      };

      const formatted = formatSceneStats(stats);

      expect(formatted).toContain('Scene Bounds:');
      expect(formatted).toContain('Min: (-10, -5, -3)');
      expect(formatted).toContain('Max: (10, 5, 3)');
    });

    it('should sort components by count', () => {
      const stats: ISceneStats = {
        totalEntities: 10,
        rootEntities: 1,
        componentCounts: {
          Light: 2,
          Transform: 10,
          MeshRenderer: 5,
        },
        truncated: false,
      };

      const formatted = formatSceneStats(stats);
      const lines = formatted.split('\n');

      // Transform (10) should appear before MeshRenderer (5) before Light (2)
      const transformIndex = lines.findIndex((l) => l.includes('Transform: 10'));
      const meshRendererIndex = lines.findIndex((l) => l.includes('MeshRenderer: 5'));
      const lightIndex = lines.findIndex((l) => l.includes('Light: 2'));

      expect(transformIndex).toBeLessThan(meshRendererIndex);
      expect(meshRendererIndex).toBeLessThan(lightIndex);
    });
  });
});

/**
 * Tests for Enhanced Scene Query Tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeSceneQuery, sceneQueryTool } from '../SceneQueryTool';

vi.mock('../utils/entityIntrospection', () => {
  const mockGetEntitySummaries = vi.fn();
  const mockGetEntityDetail = vi.fn();
  const mockGetSceneStats = vi.fn();
  const mockFormatEntityList = vi.fn();
  const mockFormatSceneStats = vi.fn();

  return {
    getEntitySummaries: mockGetEntitySummaries,
    getEntityDetail: mockGetEntityDetail,
    getSceneStats: mockGetSceneStats,
    formatEntityList: mockFormatEntityList,
    formatSceneStats: mockFormatSceneStats,
  };
});

// Get mocked functions after import
import {
  getEntitySummaries,
  getEntityDetail,
  getSceneStats,
  formatEntityList,
  formatSceneStats,
} from '../utils/entityIntrospection';

const mockGetEntitySummaries = vi.mocked(getEntitySummaries);
const mockGetEntityDetail = vi.mocked(getEntityDetail);
const mockGetSceneStats = vi.mocked(getSceneStats);
const mockFormatEntityList = vi.mocked(formatEntityList);
const mockFormatSceneStats = vi.mocked(formatSceneStats);

describe('SceneQueryTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Definition', () => {
    it('should have correct name and description', () => {
      expect(sceneQueryTool.name).toBe('scene_query');
      expect(sceneQueryTool.description).toContain('structured data');
    });

    it('should define all query types', () => {
      const queryTypes = sceneQueryTool.input_schema.properties.query_type.enum;
      expect(queryTypes).toContain('list_entities');
      expect(queryTypes).toContain('get_entity_details');
      expect(queryTypes).toContain('list_components');
      expect(queryTypes).toContain('get_component_schema');
      expect(queryTypes).toContain('get_scene_summary');
    });

    it('should define filter parameters', () => {
      const filterProps = sceneQueryTool.input_schema.properties.filter.properties;
      expect(filterProps).toHaveProperty('component');
      expect(filterProps).toHaveProperty('nameContains');
      expect(filterProps).toHaveProperty('parentId');
    });

    it('should define limit parameter', () => {
      expect(sceneQueryTool.input_schema.properties.limit).toBeDefined();
      expect(sceneQueryTool.input_schema.properties.limit.type).toBe('number');
    });
  });

  describe('list_entities', () => {
    beforeEach(() => {
      mockGetEntitySummaries.mockReturnValue([
        { id: 1, name: 'Entity1', components: ['Transform'] },
        { id: 2, name: 'Entity2', components: ['Transform', 'MeshRenderer'] },
      ]);
      mockFormatEntityList.mockReturnValue('Formatted entity list');
    });

    it('should list entities with default limit', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(25, undefined);
      expect(mockFormatEntityList).toHaveBeenCalledWith(expect.anything(), false);
    });

    it('should respect custom limit', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        limit: 50,
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(50, undefined);
    });

    it('should cap limit at 100', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        limit: 200,
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(100, undefined);
    });

    it('should apply component filter', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        filter: { component: 'MeshRenderer' },
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(25, {
        component: 'MeshRenderer',
      });
    });

    it('should apply name filter', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        filter: { nameContains: 'box' },
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(25, {
        nameContains: 'box',
      });
    });

    it('should apply parent filter', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        filter: { parentId: 1 },
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(25, {
        parentId: 1,
      });
    });

    it('should apply multiple filters', async () => {
      await executeSceneQuery({
        query_type: 'list_entities',
        limit: 10,
        filter: {
          component: 'Transform',
          nameContains: 'test',
          parentId: 5,
        },
      });

      expect(mockGetEntitySummaries).toHaveBeenCalledWith(10, {
        component: 'Transform',
        nameContains: 'test',
        parentId: 5,
      });
    });

    it('should indicate truncation when limit reached', async () => {
      mockGetEntitySummaries.mockReturnValue(new Array(25).fill({ id: 1 }));

      await executeSceneQuery({
        query_type: 'list_entities',
        limit: 25,
      });

      expect(mockFormatEntityList).toHaveBeenCalledWith(expect.anything(), true);
    });

    it('should return formatted string', async () => {
      const result = await executeSceneQuery({
        query_type: 'list_entities',
      });

      expect(result).toBe('Formatted entity list');
    });
  });

  describe('get_entity_details', () => {
    beforeEach(() => {
      mockGetEntityDetail.mockReturnValue({
        id: 1,
        name: 'TestEntity',
        components: ['Transform', 'MeshRenderer'],
        transform: { position: [0, 1, 2] },
        material: { meshId: 'cube', color: '#ff0000' },
        allComponents: { Transform: {}, MeshRenderer: {} },
        children: [2, 3],
        depth: 1,
        parent: 0,
      });
    });

    it('should return error if entity_id not provided', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
      });

      expect(result).toContain('Error');
      expect(result).toContain('entity_id is required');
    });

    it('should get entity details', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 1,
      });

      expect(mockGetEntityDetail).toHaveBeenCalledWith(1);
      expect(result).toContain('TestEntity');
      expect(result).toContain('Transform');
      expect(result).toContain('MeshRenderer');
    });

    it('should format transform data', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 1,
      });

      expect(result).toContain('Position: (0, 1, 2)');
    });

    it('should format material data', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 1,
      });

      expect(result).toContain('Mesh: cube');
      expect(result).toContain('Color: #ff0000');
    });

    it('should show children count', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 1,
      });

      expect(result).toContain('Children');
      expect(result).toContain('2, 3');
    });

    it('should include component data JSON', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 1,
      });

      expect(result).toContain('Component Data');
      expect(result).toContain('```json');
    });

    it('should handle non-existent entity', async () => {
      mockGetEntityDetail.mockReturnValue(null);

      const result = await executeSceneQuery({
        query_type: 'get_entity_details',
        entity_id: 999,
      });

      expect(result).toContain('not found');
    });
  });

  describe('get_scene_summary', () => {
    beforeEach(() => {
      mockGetSceneStats.mockReturnValue({
        totalEntities: 10,
        rootEntities: 3,
        componentCounts: { Transform: 10, MeshRenderer: 5 },
        truncated: false,
      });
      mockFormatSceneStats.mockReturnValue('Formatted scene stats');
    });

    it('should get scene summary', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_scene_summary',
      });

      expect(mockGetSceneStats).toHaveBeenCalled();
      expect(mockFormatSceneStats).toHaveBeenCalled();
      expect(result).toBe('Formatted scene stats');
    });
  });

  describe('list_components', () => {
    it('should return list of known component types', async () => {
      const result = await executeSceneQuery({
        query_type: 'list_components',
      });

      expect(result).toContain('Transform');
      expect(result).toContain('MeshRenderer');
      expect(result).toContain('Light');
      expect(result).toContain('Camera');
    });
  });

  describe('get_component_schema', () => {
    it('should return error if component_type not provided', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_component_schema',
      });

      expect(result).toContain('Error');
      expect(result).toContain('component_type is required');
    });

    it('should return Transform schema', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_component_schema',
        component_type: 'Transform',
      });

      expect(result).toContain('Transform Component Schema');
      expect(result).toContain('position');
      expect(result).toContain('rotation');
      expect(result).toContain('scale');
    });

    it('should return MeshRenderer schema', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_component_schema',
        component_type: 'MeshRenderer',
      });

      expect(result).toContain('MeshRenderer Component Schema');
      expect(result).toContain('geometry');
      expect(result).toContain('material');
    });

    it('should return error for unknown component type', async () => {
      const result = await executeSceneQuery({
        query_type: 'get_component_schema',
        component_type: 'UnknownComponent',
      });

      expect(result).toContain('Unknown component type');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown query type', async () => {
      const result = await executeSceneQuery({
        query_type: 'invalid_query' as never,
      });

      expect(result).toContain('Unknown query type');
    });
  });
});

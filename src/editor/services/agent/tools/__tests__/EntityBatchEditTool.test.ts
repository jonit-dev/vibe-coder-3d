/**
 * Tests for Entity Batch Edit Tool
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeEntityBatchEdit, entityBatchEditTool } from '../EntityBatchEditTool';

// Mock dependencies
const mockUpdateComponent = vi.fn();
const mockGetComponentData = vi.fn();
const mockHasComponent = vi.fn();
const mockListAllEntities = vi.fn(() => [1, 2, 3, 4, 5]);

vi.mock('@core/lib/ecs/ComponentRegistry', () => ({
  ComponentRegistry: {
    getInstance: () => ({
      updateComponent: mockUpdateComponent,
      getComponentData: mockGetComponentData,
    }),
  },
}));

vi.mock('@core/lib/ecs/queries/entityQueries', () => ({
  EntityQueries: {
    getInstance: () => ({
      listAllEntities: mockListAllEntities,
      hasComponent: mockHasComponent,
    }),
  },
}));

describe('EntityBatchEditTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Definition', () => {
    it('should have correct name and description', () => {
      expect(entityBatchEditTool.name).toBe('entity_batch_edit');
      expect(entityBatchEditTool.description).toContain('transforms/materials');
    });

    it('should define correct actions', () => {
      const actionEnum = entityBatchEditTool.input_schema.properties.action.enum;
      expect(actionEnum).toContain('set_transforms');
      expect(actionEnum).toContain('offset_position');
      expect(actionEnum).toContain('set_material');
    });
  });

  describe('set_transforms action', () => {
    beforeEach(() => {
      mockHasComponent.mockReturnValue(true);
      mockGetComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
      mockUpdateComponent.mockResolvedValue(undefined);
    });

    it('should update transforms for multiple entities', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          {
            entity_id: 1,
            position: { x: 1, y: 2, z: 3 },
          },
          {
            entity_id: 2,
            rotation: { x: 0, y: 45, z: 0 },
          },
        ],
      });

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2);
      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'Transform', {
        position: [1, 2, 3],
      });
      expect(mockUpdateComponent).toHaveBeenCalledWith(2, 'Transform', {
        rotation: [0, 45, 0],
      });
      expect(result).toContain('2 succeeded');
      expect(result).toContain('0 skipped');
    });

    it('should update position, rotation, and scale together', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          {
            entity_id: 1,
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 45, z: 0 },
            scale: { x: 2, y: 2, z: 2 },
          },
        ],
      });

      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'Transform', {
        position: [1, 2, 3],
        rotation: [0, 45, 0],
        scale: [2, 2, 2],
      });
      expect(result).toContain('1 succeeded');
    });

    it('should skip entities without Transform component', async () => {
      mockHasComponent.mockReturnValue(false);

      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          {
            entity_id: 1,
            position: { x: 1, y: 2, z: 3 },
          },
        ],
      });

      expect(mockUpdateComponent).not.toHaveBeenCalled();
      expect(result).toContain('0 succeeded');
      expect(result).toContain('1 skipped');
      expect(result).toContain('no Transform component');
    });

    it('should skip non-existent entities', async () => {
      mockListAllEntities.mockReturnValue([1, 2]);

      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          {
            entity_id: 999,
            position: { x: 1, y: 2, z: 3 },
          },
        ],
      });

      expect(mockUpdateComponent).not.toHaveBeenCalled();
      expect(result).toContain('0 succeeded');
      expect(result).toContain('1 skipped');
      expect(result).toContain('not found');
    });

    it('should handle update failures gracefully', async () => {
      mockUpdateComponent.mockRejectedValue(new Error('Update failed'));

      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          {
            entity_id: 1,
            position: { x: 1, y: 2, z: 3 },
          },
        ],
      });

      expect(result).toContain('0 succeeded');
      expect(result).toContain('1 skipped');
      expect(result).toContain('update failed');
    });
  });

  describe('offset_position action', () => {
    beforeEach(() => {
      mockHasComponent.mockReturnValue(true);
      mockGetComponentData.mockImplementation((id: number) => {
        return { position: [5, 10, 15] };
      });
      mockUpdateComponent.mockResolvedValue(undefined);
    });

    it('should offset positions for multiple entities', async () => {
      const result = await executeEntityBatchEdit({
        action: 'offset_position',
        entity_ids: [1, 2],
        offset: { x: 1, y: 2, z: 3 },
      });

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2);
      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'Transform', {
        position: [6, 12, 18],
      });
      expect(result).toContain('2 succeeded');
    });

    it('should apply negative offsets', async () => {
      const result = await executeEntityBatchEdit({
        action: 'offset_position',
        entity_ids: [1],
        offset: { x: -2, y: -3, z: -4 },
      });

      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'Transform', {
        position: [3, 7, 11],
      });
    });

    it('should skip entities without Transform component', async () => {
      mockHasComponent.mockReturnValue(false);

      const result = await executeEntityBatchEdit({
        action: 'offset_position',
        entity_ids: [1],
        offset: { x: 1, y: 2, z: 3 },
      });

      expect(mockUpdateComponent).not.toHaveBeenCalled();
      expect(result).toContain('0 succeeded');
      expect(result).toContain('1 skipped');
    });

    it('should skip entities without position data', async () => {
      mockGetComponentData.mockReturnValue({});

      const result = await executeEntityBatchEdit({
        action: 'offset_position',
        entity_ids: [1],
        offset: { x: 1, y: 2, z: 3 },
      });

      expect(mockUpdateComponent).not.toHaveBeenCalled();
      expect(result).toContain('no position data');
    });
  });

  describe('set_material action', () => {
    beforeEach(() => {
      mockHasComponent.mockReturnValue(true);
      mockUpdateComponent.mockResolvedValue(undefined);
    });

    it('should set material uniformly for multiple entities', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_material',
        entity_ids: [1, 2],
        material: {
          color: '#ff0000',
          materialId: 'mat1',
        },
      });

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2);
      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'MeshRenderer', {
        material: {
          color: '#ff0000',
          materialId: 'mat1',
        },
      });
      expect(result).toContain('2 succeeded');
    });

    it('should set materials individually for entities', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_material',
        materials: [
          {
            entity_id: 1,
            material: { color: '#ff0000' },
          },
          {
            entity_id: 2,
            material: { color: '#00ff00' },
          },
        ],
      });

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2);
      expect(mockUpdateComponent).toHaveBeenCalledWith(1, 'MeshRenderer', {
        material: { color: '#ff0000' },
      });
      expect(mockUpdateComponent).toHaveBeenCalledWith(2, 'MeshRenderer', {
        material: { color: '#00ff00' },
      });
      expect(result).toContain('2 succeeded');
    });

    it('should skip entities without MeshRenderer component', async () => {
      mockHasComponent.mockReturnValue(false);

      const result = await executeEntityBatchEdit({
        action: 'set_material',
        entity_ids: [1],
        material: { color: '#ff0000' },
      });

      expect(mockUpdateComponent).not.toHaveBeenCalled();
      expect(result).toContain('0 succeeded');
      expect(result).toContain('1 skipped');
      expect(result).toContain('no MeshRenderer component');
    });

    it('should return error for invalid parameters', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_material',
      });

      expect(result).toContain('Error');
      expect(result).toContain('materials array or entity_ids + material');
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown action', async () => {
      const result = await executeEntityBatchEdit({
        action: 'invalid_action' as never,
      });

      expect(result).toContain('Unknown action');
    });

    it('should handle empty entity arrays', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [],
      });

      expect(result).toContain('0 succeeded');
      expect(result).toContain('0 skipped');
    });
  });

  describe('Integration', () => {
    beforeEach(() => {
      mockListAllEntities.mockReturnValue([1, 2, 3, 4, 5]);
      mockHasComponent.mockImplementation((id: number, component: string) => {
        if (component === 'Transform' && id <= 3) return true;
        if (component === 'MeshRenderer' && id <= 2) return true;
        return false;
      });
      mockGetComponentData.mockImplementation((id: number) => {
        if (id === 1) return { position: [0, 0, 0] };
        if (id === 2) return { position: [10, 0, 0] };
        if (id === 3) return { position: [20, 0, 0] };
        return null;
      });
      mockUpdateComponent.mockResolvedValue(undefined);
    });

    it('should handle mixed success and failure', async () => {
      const result = await executeEntityBatchEdit({
        action: 'offset_position',
        entity_ids: [1, 2, 4, 5], // 4 and 5 don't have Transform
        offset: { x: 5, y: 0, z: 0 },
      });

      expect(mockUpdateComponent).toHaveBeenCalledTimes(2); // Only 1 and 2
      expect(result).toContain('2 succeeded');
      expect(result).toContain('2 skipped');
    });

    it('should provide detailed error messages for skipped entities', async () => {
      const result = await executeEntityBatchEdit({
        action: 'set_transforms',
        entities: [
          { entity_id: 1, position: { x: 1, y: 2, z: 3 } },
          { entity_id: 999, position: { x: 4, y: 5, z: 6 } },
          { entity_id: 5, position: { x: 7, y: 8, z: 9 } },
        ],
      });

      expect(result).toContain('Details:');
      expect(result).toContain('Entity 999: not found');
      expect(result).toContain('Entity 5: no Transform component');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayModeState } from '../usePlayModeState';
import { useComponentManager } from '../useComponentManager';
import { useEntityManager } from '../useEntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';

// Mock dependencies
vi.mock('../useComponentManager');
vi.mock('../useEntityManager');
vi.mock('@/core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    listComponents: vi.fn(),
  },
}));
vi.mock('@/core/lib/logger', () => ({
  Logger: {
    create: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

describe('usePlayModeState', () => {
  let mockEntityManager: any;
  let mockComponentManager: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock entity manager
    mockEntityManager = {
      getAllEntities: vi.fn(),
      getEntity: vi.fn(),
      deleteEntity: vi.fn(),
    };

    // Setup mock component manager
    mockComponentManager = {
      getComponentData: vi.fn(),
      updateComponent: vi.fn(),
      removeComponent: vi.fn(),
    };

    // Mock hooks to return our mocked managers
    (useEntityManager as any).mockReturnValue(mockEntityManager);
    (useComponentManager as any).mockReturnValue(mockComponentManager);

    // Mock component registry
    (componentRegistry.listComponents as any).mockReturnValue([
      'Transform',
      'MeshRenderer',
      'RigidBody',
    ]);
  });

  describe('backupTransforms', () => {
    it('should backup all component data for all entities', () => {
      // Arrange
      const entities = [
        { id: 1, name: 'Entity 1' },
        { id: 2, name: 'Entity 2' },
      ];

      mockEntityManager.getAllEntities.mockReturnValue(entities);

      // Entity 1 has Transform and MeshRenderer
      mockComponentManager.getComponentData.mockImplementation(
        (entityId: number, componentType: string) => {
          if (entityId === 1 && componentType === 'Transform') {
            return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
          }
          if (entityId === 1 && componentType === 'MeshRenderer') {
            return { meshType: 'cube', color: '#ff0000' };
          }
          if (entityId === 2 && componentType === 'Transform') {
            return { position: [5, 10, 15], rotation: [0, 90, 0], scale: [2, 2, 2] };
          }
          return null;
        },
      );

      const { result } = renderHook(() => usePlayModeState());

      // Act
      act(() => {
        result.current.backupTransforms();
      });

      // Assert
      expect(mockEntityManager.getAllEntities).toHaveBeenCalled();
      expect(mockComponentManager.getComponentData).toHaveBeenCalled();
      expect(result.current.hasBackup()).toBe(true);
    });

    it('should handle entities with no components', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Empty Entity' }]);
      mockComponentManager.getComponentData.mockReturnValue(null);

      const { result } = renderHook(() => usePlayModeState());

      // Act
      act(() => {
        result.current.backupTransforms();
      });

      // Assert
      expect(result.current.hasBackup()).toBe(true);
    });

    it('should deep clone component data to prevent reference issues', () => {
      // Arrange
      const originalData = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);

      // Return originalData during backup
      mockComponentManager.getComponentData.mockReturnValue(originalData);

      const { result } = renderHook(() => usePlayModeState());

      // Act
      act(() => {
        result.current.backupTransforms();
      });

      // Modify original data
      originalData.position[0] = 999;

      // Setup for restore - entity still exists
      mockEntityManager.getEntity.mockReturnValue({ id: 1, name: 'Entity 1' });

      // During restore, return the modified data (to show current state)
      mockComponentManager.getComponentData.mockReturnValue(originalData);

      // Restore and verify the backup wasn't affected
      act(() => {
        result.current.restoreTransforms();
      });

      const updateCalls = mockComponentManager.updateComponent.mock.calls;
      const restoredData = updateCalls.find((call) => call[1] === 'Transform')?.[2];
      expect(restoredData?.position[0]).toBe(0); // Should be original value, not 999
    });
  });

  describe('restoreTransforms', () => {
    it('should restore all backed up component data', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      // Backup
      act(() => {
        result.current.backupTransforms();
      });

      // Simulate entity still exists
      mockEntityManager.getEntity.mockReturnValue({ id: 1, name: 'Entity 1' });

      // Simulate component still exists
      mockComponentManager.getComponentData.mockReturnValue({
        position: [100, 200, 300], // Modified during play mode
        rotation: [45, 90, 180],
        scale: [5, 5, 5],
      });

      // Act
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert
      expect(mockComponentManager.updateComponent).toHaveBeenCalled();
    });

    it('should skip entities that no longer exist', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      // Simulate entity was deleted
      mockEntityManager.getEntity.mockReturnValue(null);

      // Act
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - updateComponent should not be called since entity doesn't exist
      expect(mockComponentManager.updateComponent).not.toHaveBeenCalled();
    });

    it('should remove components added during play mode', () => {
      // Arrange - Entity starts with only Transform
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);

      // During backup, entity has only Transform
      let backupPhase = true;
      mockComponentManager.getComponentData.mockImplementation(
        (entityId: number, componentType: string) => {
          if (componentType === 'Transform') {
            return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
          }
          if (!backupPhase && componentType === 'RigidBody') {
            // RigidBody was added during play mode
            return { mass: 1, bodyType: 'dynamic' };
          }
          return null;
        },
      );

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      // Switch to restore phase - entity now has Transform AND RigidBody
      backupPhase = false;
      mockEntityManager.getEntity.mockReturnValue({ id: 1, name: 'Entity 1' });

      // Act
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - RigidBody should be removed
      expect(mockComponentManager.removeComponent).toHaveBeenCalledWith(1, 'RigidBody');
    });

    it('should remove entities created during play mode', () => {
      // Arrange - Start with entity 1
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      // During play mode, entity 2 was created
      mockEntityManager.getAllEntities.mockReturnValue([
        { id: 1, name: 'Entity 1' },
        { id: 2, name: 'Entity 2' }, // This was created during play mode
      ]);

      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return { id: 1, name: 'Entity 1' };
        if (id === 2) return { id: 2, name: 'Entity 2' };
        return null;
      });

      // Act
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - Entity 2 should be removed
      expect(mockEntityManager.deleteEntity).toHaveBeenCalledWith(2);
    });

    it('should handle errors during component restoration gracefully', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      mockEntityManager.getEntity.mockReturnValue({ id: 1, name: 'Entity 1' });
      mockComponentManager.updateComponent.mockImplementation(() => {
        throw new Error('Component update failed');
      });

      // Act - should not throw
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - error should be logged but not thrown
      expect(mockComponentManager.updateComponent).toHaveBeenCalled();
    });
  });

  describe('clearBackup', () => {
    it('should clear backup data', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      expect(result.current.hasBackup()).toBe(true);

      // Act
      act(() => {
        result.current.clearBackup();
      });

      // Assert
      expect(result.current.hasBackup()).toBe(false);
    });
  });

  describe('hasBackup', () => {
    it('should return false when no backup exists', () => {
      const { result } = renderHook(() => usePlayModeState());

      expect(result.current.hasBackup()).toBe(false);
    });

    it('should return true when backup exists', () => {
      mockEntityManager.getAllEntities.mockReturnValue([{ id: 1, name: 'Entity 1' }]);
      mockComponentManager.getComponentData.mockReturnValue({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });

      const { result } = renderHook(() => usePlayModeState());

      act(() => {
        result.current.backupTransforms();
      });

      expect(result.current.hasBackup()).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete play mode cycle with script modifications', () => {
      // Arrange - Initial state
      const entity1 = { id: 1, name: 'Player' };
      mockEntityManager.getAllEntities.mockReturnValue([entity1]);

      let transformData = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
      mockComponentManager.getComponentData.mockImplementation(
        (entityId: number, componentType: string) => {
          if (componentType === 'Transform') return transformData;
          return null;
        },
      );

      const { result } = renderHook(() => usePlayModeState());

      // Act 1: Start play mode - backup state
      act(() => {
        result.current.backupTransforms();
      });

      // Act 2: Script modifies transform during play mode
      transformData = { position: [100, 50, 25], rotation: [0, 90, 0], scale: [2, 2, 2] };
      mockEntityManager.getEntity.mockReturnValue(entity1);

      // Act 3: Stop play mode - restore state
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - Original transform should be restored
      const updateCalls = mockComponentManager.updateComponent.mock.calls;
      const restoredTransform = updateCalls.find((call) => call[1] === 'Transform')?.[2];
      expect(restoredTransform).toEqual({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      });
    });

    it('should handle multiple entities with mixed component modifications', () => {
      // Arrange
      mockEntityManager.getAllEntities.mockReturnValue([
        { id: 1, name: 'Entity 1' },
        { id: 2, name: 'Entity 2' },
      ]);

      mockComponentManager.getComponentData.mockImplementation(
        (entityId: number, componentType: string) => {
          if (entityId === 1 && componentType === 'Transform') {
            return { position: [1, 1, 1], rotation: [0, 0, 0], scale: [1, 1, 1] };
          }
          if (entityId === 2 && componentType === 'Transform') {
            return { position: [2, 2, 2], rotation: [0, 0, 0], scale: [1, 1, 1] };
          }
          if (entityId === 2 && componentType === 'MeshRenderer') {
            return { meshType: 'sphere', color: '#00ff00' };
          }
          return null;
        },
      );

      const { result } = renderHook(() => usePlayModeState());

      // Backup
      act(() => {
        result.current.backupTransforms();
      });

      // Simulate play mode changes
      mockEntityManager.getEntity.mockImplementation((id: number) => {
        if (id === 1) return { id: 1, name: 'Entity 1' };
        if (id === 2) return { id: 2, name: 'Entity 2' };
        return null;
      });

      mockComponentManager.getComponentData.mockImplementation(
        (entityId: number, componentType: string) => {
          // Entity 1 transform modified
          if (entityId === 1 && componentType === 'Transform') {
            return { position: [999, 999, 999], rotation: [45, 45, 45], scale: [5, 5, 5] };
          }
          // Entity 2 transform modified, MeshRenderer modified
          if (entityId === 2 && componentType === 'Transform') {
            return { position: [888, 888, 888], rotation: [90, 90, 90], scale: [10, 10, 10] };
          }
          if (entityId === 2 && componentType === 'MeshRenderer') {
            return { meshType: 'cube', color: '#ff0000' }; // Modified
          }
          return null;
        },
      );

      // Restore
      act(() => {
        result.current.restoreTransforms();
      });

      // Assert - Both entities should be restored
      expect(mockComponentManager.updateComponent).toHaveBeenCalled();
      const updateCalls = mockComponentManager.updateComponent.mock.calls;

      // Verify entity 1 transform restored
      const entity1TransformRestore = updateCalls.find(
        (call) => call[0] === 1 && call[1] === 'Transform',
      );
      expect(entity1TransformRestore).toBeDefined();

      // Verify entity 2 components restored
      const entity2TransformRestore = updateCalls.find(
        (call) => call[0] === 2 && call[1] === 'Transform',
      );
      const entity2MeshRendererRestore = updateCalls.find(
        (call) => call[0] === 2 && call[1] === 'MeshRenderer',
      );
      expect(entity2TransformRestore).toBeDefined();
      expect(entity2MeshRendererRestore).toBeDefined();
    });
  });
});

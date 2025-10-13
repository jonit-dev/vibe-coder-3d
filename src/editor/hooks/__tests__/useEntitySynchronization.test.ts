import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntitySynchronization } from '../useEntitySynchronization';

// Mock useEntityManager
const mockAddEventListener = vi.fn();
const mockGetAllEntities = vi.fn();
const mockEntityManager = {
  addEventListener: mockAddEventListener,
  getAllEntities: mockGetAllEntities,
};

vi.mock('../useEntityManager', () => ({
  useEntityManager: () => mockEntityManager,
}));

describe('useEntitySynchronization', () => {
  let mockSetEntityIds: ReturnType<typeof vi.fn>;
  let eventListener: ((event: any) => void) | null;

  beforeEach(() => {
    mockSetEntityIds = vi.fn();
    eventListener = null;

    // Reset mocks
    mockAddEventListener.mockClear();
    mockGetAllEntities.mockClear();
    mockSetEntityIds.mockClear();

    // Setup addEventListener to capture the listener
    mockAddEventListener.mockImplementation((listener) => {
      eventListener = listener;
      return () => {
        eventListener = null;
      };
    });

    // Default: return empty entity list
    mockGetAllEntities.mockReturnValue([]);
  });

  describe('initialization', () => {
    it('should call getAllEntities on mount', () => {
      mockGetAllEntities.mockReturnValue([
        { id: 1, name: 'Entity1' },
        { id: 2, name: 'Entity2' },
      ]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      expect(mockGetAllEntities).toHaveBeenCalledTimes(1);
      expect(mockSetEntityIds).toHaveBeenCalledWith([1, 2]);
    });

    it('should register event listener', () => {
      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle empty entity list', () => {
      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      expect(mockSetEntityIds).toHaveBeenCalledWith([]);
    });
  });

  describe('entity-created events', () => {
    it('should add new entity to list', async () => {
      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Trigger entity-created event
      await waitFor(() => {
        eventListener?.({ type: 'entity-created', entityId: 1 });
      });

      // Wait for microtask
      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Simulate what setEntityIds does
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([]);
      expect(newIds).toEqual([1]);
    });

    it('should not add duplicate entity', async () => {
      mockGetAllEntities.mockReturnValue([{ id: 1, name: 'Entity1' }]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [1],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Try to add same entity again
      await waitFor(() => {
        eventListener?.({ type: 'entity-created', entityId: 1 });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify it returns same array (no change)
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([1]);
      expect(newIds).toEqual([1]);
    });

    it('should handle multiple entity creations', async () => {
      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Create multiple entities
      await waitFor(() => {
        eventListener?.({ type: 'entity-created', entityId: 1 });
      });

      await waitFor(() => {
        eventListener?.({ type: 'entity-created', entityId: 2 });
      });

      await waitFor(() => {
        eventListener?.({ type: 'entity-created', entityId: 3 });
      });

      // Simulate incremental updates
      await waitFor(() => {
        expect(mockSetEntityIds.mock.calls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('entity-deleted events', () => {
    it('should remove deleted entity from list', async () => {
      mockGetAllEntities.mockReturnValue([
        { id: 1, name: 'Entity1' },
        { id: 2, name: 'Entity2' },
      ]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [1, 2],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Delete entity 1
      await waitFor(() => {
        eventListener?.({ type: 'entity-deleted', entityId: 1 });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify entity is removed
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([1, 2]);
      expect(newIds).toEqual([2]);
    });

    it('should handle deleting non-existent entity', async () => {
      mockGetAllEntities.mockReturnValue([{ id: 1, name: 'Entity1' }]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [1],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Try to delete entity that doesn't exist
      await waitFor(() => {
        eventListener?.({ type: 'entity-deleted', entityId: 999 });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify list unchanged
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([1]);
      expect(newIds).toEqual([1]); // Same array returned
    });
  });

  describe('entities-cleared events', () => {
    it('should clear all entities', async () => {
      mockGetAllEntities.mockReturnValue([
        { id: 1, name: 'Entity1' },
        { id: 2, name: 'Entity2' },
      ]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [1, 2],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Clear all entities
      await waitFor(() => {
        eventListener?.({ type: 'entities-cleared' });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify all cleared
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([1, 2]);
      expect(newIds).toEqual([]);
    });

    it('should handle clearing empty list', async () => {
      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Clear already empty list
      await waitFor(() => {
        eventListener?.({ type: 'entities-cleared' });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify same empty array returned
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([]);
      expect(newIds).toEqual([]);
    });
  });

  describe('entity-updated events', () => {
    it('should not change entity list on update', async () => {
      mockGetAllEntities.mockReturnValue([{ id: 1, name: 'Entity1' }]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [1],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Entity updated (name change, etc.)
      await waitFor(() => {
        eventListener?.({ type: 'entity-updated', entityId: 1 });
      });

      await waitFor(() => {
        expect(mockSetEntityIds).toHaveBeenCalledWith(expect.any(Function));
      });

      // Verify list unchanged
      const updater = mockSetEntityIds.mock.calls[1][0];
      const newIds = updater([1]);
      expect(newIds).toEqual([1]); // Same reference returned
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeListener = vi.fn();
      mockAddEventListener.mockReturnValue(removeListener);

      const { unmount } = renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      expect(removeListener).not.toHaveBeenCalled();

      unmount();

      expect(removeListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('batching behavior', () => {
    it('should prevent duplicate updates in same tick', async () => {
      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Fire multiple events in same tick
      eventListener?.({ type: 'entity-created', entityId: 1 });
      eventListener?.({ type: 'entity-created', entityId: 2 });
      eventListener?.({ type: 'entity-created', entityId: 3 });

      // Only one update should be scheduled due to batching
      await waitFor(() => {
        // Initial call + batched update = 2 calls max
        expect(mockSetEntityIds.mock.calls.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('performance optimization', () => {
    it('should use queueMicrotask instead of setTimeout', async () => {
      const queueMicrotaskSpy = vi.spyOn(global, 'queueMicrotask');

      mockGetAllEntities.mockReturnValue([]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Trigger event
      eventListener?.({ type: 'entity-created', entityId: 1 });

      // Should use queueMicrotask, not setTimeout
      await waitFor(() => {
        expect(queueMicrotaskSpy).toHaveBeenCalled();
      });

      queueMicrotaskSpy.mockRestore();
    });

    it('should only scan all entities once on mount', () => {
      mockGetAllEntities.mockReturnValue([
        { id: 1, name: 'Entity1' },
        { id: 2, name: 'Entity2' },
      ]);

      renderHook(() =>
        useEntitySynchronization({
          entityIds: [],
          setEntityIds: mockSetEntityIds,
        })
      );

      // Trigger multiple events
      eventListener?.({ type: 'entity-created', entityId: 3 });
      eventListener?.({ type: 'entity-deleted', entityId: 1 });
      eventListener?.({ type: 'entity-created', entityId: 4 });

      // getAllEntities should only be called once (on mount)
      expect(mockGetAllEntities).toHaveBeenCalledTimes(1);
    });
  });
});

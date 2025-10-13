/**
 * useEntitySynchronization Hook Tests
 * Tests for event-driven entity ID synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEntitySynchronization } from '../useEntitySynchronization';
import { useEntityManager } from '../useEntityManager';
import { IEntity } from '@/core/lib/ecs/IEntity';

// Mock the useEntityManager hook
vi.mock('../useEntityManager');

type EntityEventType = 'entity-created' | 'entity-deleted' | 'entity-updated' | 'entities-cleared';

interface IEntityEvent {
  type: EntityEventType;
  entityId?: number;
}

type EntityEventListener = (event: IEntityEvent) => void;

describe('useEntitySynchronization', () => {
  let mockEntityManager: {
    getAllEntities: ReturnType<typeof vi.fn>;
    getEntity: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let eventListeners: EntityEventListener[];

  beforeEach(() => {
    eventListeners = [];

    mockEntityManager = {
      getAllEntities: vi.fn().mockReturnValue([]),
      getEntity: vi.fn(),
      addEventListener: vi.fn().mockImplementation((listener: EntityEventListener) => {
        eventListeners.push(listener);
        // Return cleanup function
        return () => {
          const index = eventListeners.indexOf(listener);
          if (index > -1) {
            eventListeners.splice(index, 1);
          }
        };
      }),
    };

    (useEntityManager as ReturnType<typeof vi.fn>).mockReturnValue(mockEntityManager);
  });

  const triggerEvent = (event: IEntityEvent) => {
    eventListeners.forEach((listener) => listener(event));
  };

  it('should load initial entities on mount', () => {
    const mockEntities: IEntity[] = [
      { id: 1, name: 'Entity 1', parentId: null, children: [], components: {} },
      { id: 2, name: 'Entity 2', parentId: null, children: [], components: {} },
      { id: 3, name: 'Entity 3', parentId: null, children: [], components: {} },
    ];

    mockEntityManager.getAllEntities.mockReturnValue(mockEntities);

    const setEntityIds = vi.fn();
    renderHook(() =>
      useEntitySynchronization({
        entityIds: [],
        setEntityIds,
      }),
    );

    expect(mockEntityManager.getAllEntities).toHaveBeenCalledTimes(1);
    expect(setEntityIds).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('should return entityManager', () => {
    const { result } = renderHook(() =>
      useEntitySynchronization({
        entityIds: [],
        setEntityIds: vi.fn(),
      }),
    );

    expect(result.current.entityManager).toBe(mockEntityManager);
  });
});

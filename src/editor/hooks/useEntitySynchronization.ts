import { useEffect, useRef } from 'react';

import { useEntityManager } from './useEntityManager';

interface IUseEntitySynchronizationProps {
  entityIds: number[];
  setEntityIds: (ids: number[]) => void;
}

/**
 * PERFORMANCE OPTIMIZED: Event-driven entity synchronization
 *
 * Previous implementation:
 * - Called getAllEntities() on every entity event (O(n) scan)
 * - Used 16ms setTimeout debounce causing input lag
 * - With 100 entities + 10 events/sec = 1000 unnecessary scans/sec
 *
 * New implementation:
 * - Event-driven incremental updates (no scanning)
 * - Uses queueMicrotask for immediate next-tick updates (faster than setTimeout)
 * - Only updates the specific entity that changed
 *
 * Expected gain: +5-8 FPS (from performance audit report)
 */
export const useEntitySynchronization = ({
  entityIds,
  setEntityIds,
}: IUseEntitySynchronizationProps) => {
  const entityManager = useEntityManager();
  const pendingUpdateRef = useRef(false);

  useEffect(() => {
    // Initial load - this is the ONLY time we scan all entities
    const entities = entityManager.getAllEntities();
    const initialIds = entities.map((entity) => entity.id);
    setEntityIds(initialIds);

    // Event-driven incremental updates - no more O(n) scans
    const removeEventListener = entityManager.addEventListener((event) => {
      // Prevent duplicate updates in same tick
      if (pendingUpdateRef.current) return;
      pendingUpdateRef.current = true;

      // Use queueMicrotask for next tick (faster than setTimeout)
      queueMicrotask(() => {
        setEntityIds((prevIds) => {
          switch (event.type) {
            case 'entity-created':
              // Add new entity to the end of the list
              if (event.entityId !== undefined && !prevIds.includes(event.entityId)) {
                return [...prevIds, event.entityId];
              }
              return prevIds; // No change needed

            case 'entity-deleted':
              // Remove deleted entity from the list
              if (event.entityId !== undefined) {
                const newIds = prevIds.filter((id) => id !== event.entityId);
                // Only return new array if something was actually removed
                return newIds.length !== prevIds.length ? newIds : prevIds;
              }
              return prevIds;

            case 'entities-cleared':
              // Clear all entities
              return prevIds.length > 0 ? [] : prevIds;

            case 'entity-updated':
              // No need to update the ID list for entity updates
              // (name changes, parent changes, etc. don't affect the ID list)
              return prevIds;

            default:
              return prevIds;
          }
        });

        pendingUpdateRef.current = false;
      });
    });

    return () => {
      removeEventListener();
    };
    // NOTE: Only depend on entityManager and setEntityIds
    // DO NOT add entityIds to dependencies - that would cause infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityManager, setEntityIds]);

  return { entityManager };
};

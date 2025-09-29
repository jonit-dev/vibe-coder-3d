import { useEffect, useRef } from 'react';

import { useEntityManager } from './useEntityManager';

interface IUseEntitySynchronizationProps {
  entityIds: number[];
  setEntityIds: (ids: number[]) => void;
}

export const useEntitySynchronization = ({
  entityIds,
  setEntityIds,
}: IUseEntitySynchronizationProps) => {
  const entityManager = useEntityManager();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateEntities = () => {
      // Clear any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Batch updates to prevent rapid successive calls
      updateTimeoutRef.current = setTimeout(() => {
        const entities = entityManager.getAllEntities();
        const newIds = entities.map((entity) => entity.id);

        // Only update if the entity list actually changed
        if (
          entityIds.length !== newIds.length ||
          !entityIds.every((id, index) => id === newIds[index])
        ) {

          setEntityIds(newIds);
        }
      }, 16); // ~60fps batching
    };

    // Initial load
    updateEntities();

    // Listen for entity events for real-time reactive updates
    const removeEventListener = entityManager.addEventListener((_event) => {

      updateEntities();
    });

    return () => {
      removeEventListener();
      // Clean up pending timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [entityManager, entityIds, setEntityIds]);

  return { entityManager };
};

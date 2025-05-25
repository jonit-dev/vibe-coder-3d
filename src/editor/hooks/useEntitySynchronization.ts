import { useEffect } from 'react';

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

  useEffect(() => {
    const updateEntities = () => {
      const entities = entityManager.getAllEntities();
      const newIds = entities.map((entity) => entity.id);

      // Only update if the entity list actually changed
      if (
        entityIds.length !== newIds.length ||
        !entityIds.every((id, index) => id === newIds[index])
      ) {
        console.log(`[Editor] Entity list updated:`, newIds);
        setEntityIds(newIds);
      }
    };

    // Initial load
    updateEntities();

    // Listen for entity events for real-time reactive updates
    const removeEventListener = entityManager.addEventListener((event) => {
      console.log(`[Editor] Entity event: ${event.type}`, event.entityId);
      updateEntities();
    });

    return removeEventListener;
  }, [entityManager, entityIds, setEntityIds]);

  return { entityManager };
};

import { useEffect, useState } from 'react';

import { useEntityManager } from '@/editor/hooks/useEntityManager';

export interface IUseEntityInfo {
  entityId: number | null;
  entityName: string;
}

export const useEntityInfo = (selectedEntity: number | null): IUseEntityInfo => {
  const [entityName, setEntityName] = useState('');
  const entityManager = useEntityManager();

  useEffect(() => {
    if (selectedEntity == null) {
      setEntityName('');
      return;
    }

    const updateEntityName = () => {
      const entity = entityManager.getEntity(selectedEntity);
      if (entity) {
        setEntityName(entity.name);
      } else {
        setEntityName(`Entity ${selectedEntity}`);
      }
    };

    // Initial load
    updateEntityName();

    // For now, poll for changes since we don't have an event system yet
    // In a future improvement, we could add an event emitter to EntityManager
    const interval = setInterval(updateEntityName, 100);

    return () => {
      clearInterval(interval);
    };
  }, [selectedEntity, entityManager]);

  return { entityId: selectedEntity, entityName };
};

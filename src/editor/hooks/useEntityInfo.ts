import { useEffect, useState } from 'react';

import { getEntityName } from '@core/lib/ecs';

export interface IUseEntityInfo {
  entityId: number | null;
  entityName: string;
}

export const useEntityInfo = (selectedEntity: number | null): IUseEntityInfo => {
  const [entityName, setEntityName] = useState('');

  useEffect(() => {
    if (selectedEntity == null) {
      setEntityName('');
      return;
    }
    setEntityName(getEntityName(selectedEntity) || `Entity ${selectedEntity}`);
  }, [selectedEntity]);

  return { entityId: selectedEntity, entityName };
};

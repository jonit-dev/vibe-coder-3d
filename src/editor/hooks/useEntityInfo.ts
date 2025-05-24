import { useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';

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

    const updateEntityName = () => {
      const nameData = componentManager.getComponentData(selectedEntity, 'name');
      if (nameData?.value) {
        setEntityName(nameData.value);
      } else {
        setEntityName(`Entity ${selectedEntity}`);
      }
    };

    // Initial load
    updateEntityName();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === selectedEntity && event.componentId === 'name') {
        updateEntityName();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [selectedEntity]);

  return { entityId: selectedEntity, entityName };
};

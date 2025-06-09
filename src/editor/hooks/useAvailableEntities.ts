import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { EntityMetaConverter } from '@/core/lib/ecs/utils/componentConverters';
import { useMemo } from 'react';
import { useComponentManager } from './useComponentManager';

export interface IEntityOption {
  value: string;
  label: string;
}

export const useAvailableEntities = (excludeEntityId?: number) => {
  const componentManager = useComponentManager();

  const entityOptions = useMemo(() => {
    const transformEntities = componentManager.getEntitiesWithComponent(
      KnownComponentTypes.TRANSFORM,
    );

    const options: IEntityOption[] = [{ value: '0', label: 'None' }];

    transformEntities.forEach((entityId) => {
      // Skip the excluded entity (e.g., don't let camera follow itself)
      if (excludeEntityId && entityId === excludeEntityId) {
        return;
      }

      // Skip entity ID 0 to avoid duplicate keys with "None" option
      if (entityId === 0) {
        return;
      }

      // Get actual entity name from naming system
      const entityName = EntityMetaConverter.getName(entityId) || `Entity ${entityId}`;
      options.push({
        value: entityId.toString(),
        label: entityName,
      });
    });

    return options;
  }, [componentManager, excludeEntityId]);

  return entityOptions;
};

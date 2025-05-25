import React from 'react';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

export const ComponentDebugger: React.FC = () => {
  const componentManager = useComponentManager();
  const entityManager = useEntityManager();

  const allEntities = entityManager.getAllEntities();
  const componentTypes = Object.values(KnownComponentTypes);

  return (
    <div className="p-4 bg-gray-800 text-white text-xs">
      <h3 className="font-bold mb-2">ECS Debug</h3>
      <div className="mb-4">
        <strong>Entities ({allEntities.length}):</strong>
        <ul className="ml-4 mt-1">
          {allEntities.map((entity) => {
            const components = componentManager.getComponentsForEntity(entity.id);
            return (
              <li key={entity.id}>
                Entity {entity.id} - {entity.name} ({components.length} components:{' '}
                {components.map((c) => c.type).join(', ')})
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <strong>Known Component Types ({componentTypes.length}):</strong>
        <ul className="ml-4 mt-1">
          {componentTypes.map((type) => {
            const entitiesWithType = componentManager.getEntitiesWithComponent(type);
            return (
              <li key={type}>
                {type} ({entitiesWithType.length} entities)
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

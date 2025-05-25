import React from 'react';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

interface IDynamicComponentDemoProps {
  entityId: number;
}

export const DynamicComponentDemo: React.FC<IDynamicComponentDemoProps> = ({ entityId }) => {
  const componentManager = useComponentManager();
  const entityManager = useEntityManager();

  const entity = entityManager.getEntity(entityId);
  const entityComponents = componentManager.getComponentsForEntity(entityId);
  const availableComponentTypes = Object.values(KnownComponentTypes);

  const handleAddComponent = (componentType: string) => {
    let defaultData = {};
    switch (componentType) {
      case KnownComponentTypes.TRANSFORM:
        defaultData = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
        break;
      case KnownComponentTypes.MESH_RENDERER:
        defaultData = { meshId: 'cube', materialId: 'default', enabled: true };
        break;
      case KnownComponentTypes.RIGID_BODY:
        defaultData = { type: 'dynamic', mass: 1, enabled: true };
        break;
      case KnownComponentTypes.MESH_COLLIDER:
        defaultData = { type: 'box', enabled: true };
        break;
    }

    componentManager.addComponent(entityId, componentType, defaultData);
  };

  const handleRemoveComponent = (componentType: string) => {
    componentManager.removeComponent(entityId, componentType);
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-lg font-bold mb-4">ECS Demo - Entity {entityId}</h2>

      {entity && (
        <div className="mb-4">
          <h3 className="font-semibold">Entity Info:</h3>
          <p>Name: {entity.name}</p>
          <p>ID: {entity.id}</p>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold">Current Components ({entityComponents.length}):</h3>
        <ul className="list-disc list-inside">
          {entityComponents.map((component) => (
            <li key={component.type} className="flex justify-between items-center">
              <span>{component.type}</span>
              <button
                onClick={() => handleRemoveComponent(component.type)}
                className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold">Available Component Types:</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableComponentTypes.slice(0, 5).map((componentType) => (
            <button
              key={componentType}
              onClick={() => handleAddComponent(componentType)}
              className="p-2 bg-blue-600 text-white rounded text-sm"
              disabled={entityComponents.some((c) => c.type === componentType)}
            >
              Add {componentType}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

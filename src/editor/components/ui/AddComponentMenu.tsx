import React, { useMemo } from 'react';
import { FiX } from 'react-icons/fi';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

interface IAddComponentMenuProps {
  entityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddComponentMenu: React.FC<IAddComponentMenuProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const componentManager = useComponentManager();

  // Get components for this entity using new ECS system
  const entityComponents = useMemo(() => {
    if (!entityId) return [];
    return componentManager.getComponentsForEntity(entityId);
  }, [entityId, componentManager]);

  // Get available components from KnownComponentTypes
  const availableComponents = useMemo(() => {
    if (!entityId) return [];
    const existingTypes = entityComponents.map((c) => c.type);

    return Object.values(KnownComponentTypes)
      .filter((type) => !existingTypes.includes(type))
      .map((type) => ({
        id: type,
        name: type,
        description: `Add ${type} component`,
      }));
  }, [entityId, entityComponents]);

  // For now, no groups in the new ECS system
  // const availableGroups: any[] = [];

  const handleAddComponent = (componentType: string) => {
    if (!entityId) return;

    // Add component with default data based on type
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
    onClose();
  };

  if (!isOpen || !entityId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-96 max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <h3 className="text-sm font-semibold text-white">Add Component</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {availableComponents.map((component) => (
              <button
                key={component.id}
                onClick={() => handleAddComponent(component.id)}
                className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
              >
                <div className="text-sm font-medium text-white">{component.name}</div>
                <div className="text-xs text-gray-400">{component.description}</div>
              </button>
            ))}
          </div>

          {availableComponents.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-4">
              No components available to add
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-750 border-t border-gray-600 text-xs text-gray-400">
          Entity {entityId} has {entityComponents.length} components
        </div>
      </div>
    </div>
  );
};

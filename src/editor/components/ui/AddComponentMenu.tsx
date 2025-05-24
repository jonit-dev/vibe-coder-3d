import React, { useMemo } from 'react';
import { FiX } from 'react-icons/fi';

import { componentManager } from '@/core/dynamic-components/init';
import { useEntityComponents } from '@/core/hooks/useComponent';

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
  const entityComponents = useEntityComponents(entityId);

  // Get available components
  const availableComponents = useMemo(() => {
    if (!entityId) return [];
    const allComponents = componentManager.getAllComponents();
    return allComponents
      .filter((component) => !entityComponents.includes(component.id))
      .filter((component) => !component.required) // Don't show required components
      .filter((component) => component.id !== 'name' && component.name !== 'Name'); // Don't show Name component
  }, [entityId, entityComponents]);

  // Get available component groups
  const availableGroups = useMemo(() => {
    if (!entityId) return [];
    return componentManager
      .getAllGroups()
      .filter((group) => componentManager.canAddGroupToEntity(entityId, group.id));
  }, [entityId, entityComponents]);

  if (!isOpen || !entityId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-96 max-h-[80vh] flex flex-col shadow-xl">
        {/* Simplified version for now */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <h3 className="text-sm font-semibold text-white">Add Component</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-300 mb-2">
            Available Components: {availableComponents.length}
          </div>
          <div className="text-sm text-gray-300 mb-2">
            Available Groups: {availableGroups.length}
          </div>
          <div className="text-xs text-gray-500">
            Entity {entityId} has {entityComponents.length} components
          </div>
        </div>
      </div>
    </div>
  );
};

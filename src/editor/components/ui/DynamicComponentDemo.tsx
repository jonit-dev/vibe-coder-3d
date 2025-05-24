import React from 'react';
import { FiCheck, FiPlus, FiX } from 'react-icons/fi';

import {
  useAvailableComponents,
  useComponentManager,
  useEntityComponents,
} from '@/core/hooks/useComponent';

interface IDynamicComponentDemoProps {
  entityId: number | null;
}

export const DynamicComponentDemo: React.FC<IDynamicComponentDemoProps> = ({ entityId }) => {
  const entityComponents = useEntityComponents(entityId);
  const availableComponents = useAvailableComponents(entityId);
  const velocityManager = useComponentManager(entityId, 'velocity');

  if (!entityId) {
    return (
      <div className="p-4 bg-gray-800 rounded border border-gray-600">
        <h3 className="text-sm font-semibold text-white mb-2">Dynamic Component Demo</h3>
        <p className="text-xs text-gray-400">No entity selected</p>
      </div>
    );
  }

  const handleToggleVelocity = async () => {
    if (velocityManager.hasComponent) {
      await velocityManager.removeComponent();
    } else {
      await velocityManager.addComponent({
        linear: [0, 0, 0],
        angular: [0, 0, 0],
        linearDamping: 0.01,
        angularDamping: 0.01,
        priority: 1,
      });
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded border border-gray-600">
      <h3 className="text-sm font-semibold text-white mb-3">Dynamic Component Demo</h3>

      {/* Current Components */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-300 mb-2">
          Current Components ({entityComponents.length})
        </h4>
        <div className="space-y-1">
          {entityComponents.map((componentId) => (
            <div key={componentId} className="flex items-center gap-2 text-xs">
              <FiCheck className="text-green-400" />
              <span className="text-gray-200">{componentId}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Components */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-300 mb-2">
          Available Components ({availableComponents.length})
        </h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {availableComponents.slice(0, 5).map((component) => (
            <div key={component.id} className="flex items-center gap-2 text-xs">
              <FiPlus className="text-blue-400" />
              <span className="text-gray-300">{component.name}</span>
              <span className="text-gray-500">({component.category})</span>
            </div>
          ))}
          {availableComponents.length > 5 && (
            <div className="text-xs text-gray-500">
              ...and {availableComponents.length - 5} more
            </div>
          )}
        </div>
      </div>

      {/* Velocity Component Demo */}
      <div className="border-t border-gray-600 pt-3">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Velocity Component Test</h4>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleToggleVelocity}
            disabled={velocityManager.isLoading}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              velocityManager.hasComponent
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {velocityManager.hasComponent ? <FiX /> : <FiPlus />}
            {velocityManager.isLoading
              ? 'Loading...'
              : velocityManager.hasComponent
                ? 'Remove Velocity'
                : 'Add Velocity'}
          </button>
        </div>

        {velocityManager.lastResult && !velocityManager.lastResult.valid && (
          <div className="text-xs text-red-400 mb-2">
            Error: {velocityManager.lastResult.errors.join(', ')}
          </div>
        )}

        {velocityManager.hasComponent && velocityManager.data && (
          <div className="text-xs text-gray-300">
            <div>Linear: [{velocityManager.data.linear?.join(', ')}]</div>
            <div>Angular: [{velocityManager.data.angular?.join(', ')}]</div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';

interface IDebugSectionProps {
  selectedEntity: number;
  components: Array<{ type: string; data: any }>;
}

export const DebugSection: React.FC<IDebugSectionProps> = ({ selectedEntity, components }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-4 p-2 bg-gray-900 rounded border border-gray-600">
      <div className="text-xs text-gray-400 mb-1">Debug - Entity {selectedEntity}:</div>
      <div className="text-xs text-gray-300 mb-2">
        <strong>Components ({components.length}):</strong>{' '}
        {components.map((c) => c.type).join(', ') || 'None'}
      </div>
      <div className="text-xs text-gray-300 mb-2">
        <strong>Component Details:</strong>
        <ul className="ml-2 mt-1">
          {components.map((component) => (
            <li key={component.type} className="text-xs">
              {component.type}: {JSON.stringify(component.data).substring(0, 50)}...
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

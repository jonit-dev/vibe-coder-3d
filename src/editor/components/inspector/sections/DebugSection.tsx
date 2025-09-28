import React, { useCallback } from 'react';

interface IDebugSectionProps {
  selectedEntity: number;
  components: Array<{ type: string; data: unknown }>;
}

export const DebugSection: React.FC<IDebugSectionProps> = ({ selectedEntity, components }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleCopyToClipboard = useCallback(async () => {
    const entityState = {
      entityId: selectedEntity,
      components: components.map(component => ({
        type: component.type,
        data: component.data
      }))
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(entityState, null, 2));
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [selectedEntity, components]);

  return (
    <div className="mt-4 p-2 bg-gray-900 rounded border border-gray-600">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-gray-400">Debug - Entity {selectedEntity}:</div>
        <button
          onClick={handleCopyToClipboard}
          className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          title="Copy entity state to clipboard"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <div className="text-xs text-gray-300 mb-2">
        <strong>Components ({components.length}):</strong>{' '}
        {components.map((c) => c.type).join(', ') || 'None'}
      </div>
      <div className="text-xs text-gray-300 mb-2">
        <strong>Component Details:</strong>
        <div className="ml-2 mt-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {components.map((component) => (
            <div key={component.type} className="text-xs mb-1 break-words">
              <span className="text-gray-400">{component.type}:</span>{' '}
              <span className="text-gray-300">{JSON.stringify(component.data)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

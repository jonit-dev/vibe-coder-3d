import React from 'react';

import { GizmoMode } from '@/editor/hooks/useEditorKeyboard';

export interface IGizmoModeSelectorProps {
  gizmoMode: GizmoMode;
  setGizmoMode: (mode: GizmoMode) => void;
}

export const GizmoModeSelector: React.FC<IGizmoModeSelectorProps> = React.memo(({
  gizmoMode,
  setGizmoMode,
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg p-1 flex gap-1">
      <button
        className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
          gizmoMode === 'translate'
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700/50'
        }`}
        onClick={() => setGizmoMode('translate')}
        title="Switch to Move Tool (W)"
      >
        <span>Move</span>
        <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">W</kbd>
      </button>
      <button
        className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
          gizmoMode === 'rotate'
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700/50'
        }`}
        onClick={() => setGizmoMode('rotate')}
        title="Switch to Rotate Tool (E)"
      >
        <span>Rotate</span>
        <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">E</kbd>
      </button>
      <button
        className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
          gizmoMode === 'scale'
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700/50'
        }`}
        onClick={() => setGizmoMode('scale')}
        title="Switch to Scale Tool (R)"
      >
        <span>Scale</span>
        <kbd className="ml-1 bg-black/30 px-1 rounded text-[10px]">R</kbd>
      </button>
    </div>
  );
});

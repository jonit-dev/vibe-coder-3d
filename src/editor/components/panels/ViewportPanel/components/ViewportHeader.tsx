import React from 'react';

export interface IViewportHeaderProps {
  entityId: number | null;
}

export const ViewportHeader: React.FC<IViewportHeaderProps> = ({ entityId }) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2 flex items-center space-x-2">
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
      <span className="text-sm text-gray-200 font-medium">Viewport</span>
      <span className="text-xs text-gray-400">
        {entityId != null ? `Entity ${entityId}` : 'No Selection'}
      </span>
    </div>
  );
};

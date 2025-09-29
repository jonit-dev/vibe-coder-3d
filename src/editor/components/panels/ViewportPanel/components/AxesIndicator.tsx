import React from 'react';

export const AxesIndicator: React.FC = React.memo(() => {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
      <div className="flex items-center space-x-2 text-sm font-medium">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-red-400">X</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-green-400">Y</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-blue-400">Z</span>
        </div>
      </div>
    </div>
  );
});

import React from 'react';
import { FiCpu } from 'react-icons/fi';

export const TopBarLogo: React.FC = React.memo(() => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
        <FiCpu className="w-4 h-4 text-white" />
      </div>
      <div>
        <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          VibeEngine
        </h1>
        <div className="text-xs text-gray-400">v1.0.0</div>
      </div>
    </div>
  );
});

TopBarLogo.displayName = 'TopBarLogo';

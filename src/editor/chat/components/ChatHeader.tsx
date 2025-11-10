/**
 * ChatHeader Component
 * Header section for chat UIs with online status
 */

import React from 'react';
import { FiCpu } from 'react-icons/fi';

export interface IChatHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  isOnline?: boolean;
}

export const ChatHeader: React.FC<IChatHeaderProps> = ({
  title = 'AI Assistant',
  icon = <FiCpu className="w-4 h-4 text-white" />,
  actions,
  isOnline = true,
}) => {
  return (
    <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

      <div className="relative z-10 flex items-center space-x-2 flex-1">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-200 truncate">{title}</h3>
          <div className={`text-[10px] ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
};

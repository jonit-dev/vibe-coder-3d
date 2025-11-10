/**
 * SidebarChatShell Component
 * Shared presentational shell for left/right sidebar chats
 */

import React from 'react';

export interface ISidebarChatShellProps {
  side: 'left' | 'right';
  isExpanded: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  children: React.ReactNode;
  input: React.ReactNode;
}

export const SidebarChatShell: React.FC<ISidebarChatShellProps> = ({
  side,
  isExpanded,
  header,
  children,
  input,
}) => {
  const base = side === 'left' ? 'border-r' : 'border-l';
  const width = side === 'left' ? (isExpanded ? 'w-80' : 'w-12') : isExpanded ? 'w-80' : 'w-16';

  return (
    <div
      className={`${width} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] ${base} border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300 z-50`}
    >
      {header}
      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
            {children}
          </div>
          <div className="p-3 border-t border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
            {input}
          </div>
        </>
      )}
    </div>
  );
};

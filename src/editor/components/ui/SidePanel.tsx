import React, { ReactNode } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

export interface ISidePanelProps {
  title: string;
  children: ReactNode;
  width?: string;
  position?: 'left' | 'right';
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  icon?: ReactNode;
  subtitle?: string;
}

export const SidePanel: React.FC<ISidePanelProps> = ({
  title,
  children,
  width = 'w-80',
  position = 'left',
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  className = '',
  icon,
  subtitle,
}) => {
  const borderClass = position === 'left' ? 'border-r' : 'border-l';

  return (
    <aside
      className={`${width} ${collapsed ? 'w-12' : ''} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] ${borderClass} border-gray-800/50 flex-shrink-0 flex flex-col h-full relative ${className} transition-all duration-300`}
    >
      {/* Panel header with glassmorphism effect */}
      <div className="h-12 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-4 relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

        <div className="relative z-10 flex items-center space-x-3 flex-1">
          {icon && <div className="w-5 h-5 text-cyan-400 flex-shrink-0">{icon}</div>}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-200 truncate">{title}</h3>
              {subtitle && <div className="text-xs text-gray-400 truncate">{subtitle}</div>}
            </div>
          )}

          {collapsible && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
              title={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {collapsed ? (
                <FiChevronRight className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Panel content */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
            {children}
          </div>
        </div>
      )}

      {/* Resize handle for future enhancement */}
      <div
        className={`absolute top-0 ${position === 'left' ? 'right-0' : 'left-0'} w-1 h-full bg-transparent hover:bg-cyan-500/30 cursor-col-resize group transition-colors duration-200`}
      >
        <div className="w-1 h-full bg-transparent group-hover:bg-cyan-500/50 transition-colors duration-200"></div>
      </div>
    </aside>
  );
};

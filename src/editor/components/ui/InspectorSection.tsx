import React, { ReactNode, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiTrash2 } from 'react-icons/fi';

export interface IInspectorSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  headerColor?: 'cyan' | 'purple' | 'green' | 'orange' | 'red';
  onRemove?: () => void;
  removable?: boolean;
}

export const InspectorSection: React.FC<IInspectorSectionProps> = ({
  title,
  children,
  icon,
  collapsible = false,
  defaultCollapsed = false,
  headerColor = 'cyan',
  onRemove,
  removable = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-500/30',
    purple: 'text-purple-400 border-purple-500/30',
    green: 'text-green-400 border-green-500/30',
    orange: 'text-orange-400 border-orange-500/30',
    red: 'text-red-400 border-red-500/30',
  };

  const glowClasses = {
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
    orange: 'bg-orange-400',
    red: 'bg-red-400',
  };

  return (
    <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-md overflow-hidden">
      {/* Section Header */}
      <div
        className={`bg-gradient-to-r from-gray-800/70 to-gray-700/70 border-b ${colorClasses[headerColor]} px-2 py-1.5`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <div className={`w-1 h-1 ${glowClasses[headerColor]} rounded-full animate-pulse`}></div>
            {icon && (
              <div
                className={`w-3 h-3 ${colorClasses[headerColor].split(' ')[0]} flex-shrink-0 flex items-center justify-center`}
              >
                <div className="w-2.5 h-2.5 flex items-center justify-center">{icon}</div>
              </div>
            )}
            <h3
              className={`text-[11px] font-semibold ${colorClasses[headerColor].split(' ')[0]} leading-none`}
            >
              {title}
            </h3>
          </div>

          <div className="flex items-center space-x-1">
            {removable && onRemove && (
              <button
                onClick={onRemove}
                className={`w-4 h-4 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-sm transition-all duration-200 flex items-center justify-center flex-shrink-0`}
                title="Remove component"
              >
                <FiTrash2 className="w-2.5 h-2.5" />
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={`w-4 h-4 ${colorClasses[headerColor].split(' ')[0]} hover:bg-gray-600/30 rounded-sm transition-all duration-200 flex items-center justify-center flex-shrink-0`}
                title={collapsed ? 'Expand section' : 'Collapse section'}
              >
                {collapsed ? (
                  <FiChevronRight className="w-2.5 h-2.5" />
                ) : (
                  <FiChevronDown className="w-2.5 h-2.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      {!collapsed && <div className="p-2 space-y-1.5">{children}</div>}
    </div>
  );
};

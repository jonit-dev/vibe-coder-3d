import React, { ReactNode, useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';

export interface ICollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  badge?: string | number;
}

export const CollapsibleSection: React.FC<ICollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  icon,
  badge,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-700/50 rounded-lg bg-gray-900/30 backdrop-blur-sm transition-all duration-200 hover:border-gray-600/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full px-3 py-2.5 flex items-center justify-between transition-all duration-200
          hover:bg-gray-800/30 rounded-t-lg
          ${isExpanded ? 'rounded-b-none border-b border-gray-700/30' : 'rounded-lg'}
        `}
      >
        <div className="flex items-center space-x-2.5">
          {/* Icon */}
          {icon && (
            <div className="w-3.5 h-3.5 text-gray-400 flex items-center justify-center">{icon}</div>
          )}

          {/* Title */}
          <span className="text-xs font-medium text-gray-300">{title}</span>

          {/* Badge */}
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-gray-700 text-gray-300 border border-gray-600/50">
              {badge}
            </span>
          )}
        </div>

        {/* Chevron */}
        <div
          className={`
          w-4 h-4 text-gray-400 transition-all duration-200 transform
          ${isExpanded ? 'rotate-90' : 'rotate-0'}
        `}
        >
          <FiChevronRight className="w-full h-full" />
        </div>
      </button>

      {/* Content with smooth animation */}
      <div
        className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
      `}
      >
        <div className="p-3 space-y-2.5">{children}</div>
      </div>
    </div>
  );
};

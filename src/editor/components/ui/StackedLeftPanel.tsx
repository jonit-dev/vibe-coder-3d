import React, { ReactNode, useState } from 'react';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiLayers,
  FiSettings,
} from 'react-icons/fi';

export interface IStackedLeftPanelProps {
  hierarchyContent: ReactNode;
  inspectorContent: ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StackedLeftPanel: React.FC<IStackedLeftPanelProps> = ({
  hierarchyContent,
  inspectorContent,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isHierarchyExpanded, setIsHierarchyExpanded] = useState(true);
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(true);

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-r border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300`}
    >
      {/* Panel collapse button when collapsed */}
      {isCollapsed && (
        <div
          className="flex-1 flex flex-col items-center justify-start pt-4 space-y-4 cursor-pointer"
          onClick={onToggleCollapse}
        >
          <div className="flex flex-col items-center space-y-2">
            <button
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Expand panel"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>

            {/* Vertical icons indicating the collapsed sections */}
            <div className="flex flex-col space-y-3 items-center">
              <div className="p-1.5 bg-gray-800/50 rounded text-cyan-400" title="Hierarchy">
                <FiLayers className="w-3 h-3" />
              </div>
              <div className="p-1.5 bg-gray-800/50 rounded text-cyan-400" title="Inspector">
                <FiSettings className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Hierarchy Section */}
          <div
            className={`flex flex-col ${isHierarchyExpanded ? 'flex-1' : 'flex-shrink-0'} border-b border-gray-700/50`}
          >
            {/* Hierarchy Header */}
            <div className="h-10 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

              <div className="relative z-10 flex items-center space-x-2 flex-1">
                <FiLayers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-gray-200">Hierarchy</span>
              </div>

              <div className="relative z-10 flex items-center space-x-1">
                <button
                  onClick={() => setIsHierarchyExpanded(!isHierarchyExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
                  title={isHierarchyExpanded ? 'Collapse hierarchy' : 'Expand hierarchy'}
                >
                  {isHierarchyExpanded ? (
                    <FiChevronUp className="w-3 h-3" />
                  ) : (
                    <FiChevronDown className="w-3 h-3" />
                  )}
                </button>

                <button
                  onClick={onToggleCollapse}
                  className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
                  title="Collapse panel"
                >
                  <FiChevronLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Hierarchy Content */}
            {isHierarchyExpanded && (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
                  {hierarchyContent}
                </div>
              </div>
            )}
          </div>

          {/* Inspector Section */}
          <div className={`flex flex-col ${isInspectorExpanded ? 'flex-1' : 'flex-shrink-0'}`}>
            {/* Inspector Header */}
            <div className="h-10 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

              <div className="relative z-10 flex items-center space-x-2 flex-1">
                <FiSettings className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-gray-200">Inspector</span>
              </div>

              <div className="relative z-10">
                <button
                  onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                  className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
                  title={isInspectorExpanded ? 'Collapse inspector' : 'Expand inspector'}
                >
                  {isInspectorExpanded ? (
                    <FiChevronUp className="w-3 h-3" />
                  ) : (
                    <FiChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Inspector Content */}
            {isInspectorExpanded && (
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
                  {inspectorContent}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Resize handle */}
      <div className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-cyan-500/30 cursor-col-resize group transition-colors duration-200">
        <div className="w-1 h-full bg-transparent group-hover:bg-cyan-500/50 transition-colors duration-200"></div>
      </div>
    </aside>
  );
};

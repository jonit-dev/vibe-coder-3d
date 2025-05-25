import React, { ReactNode, useState } from 'react';
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiLayers,
  FiPlus,
  FiSettings,
} from 'react-icons/fi';

import { EditableEntityName } from '@/editor/components/forms/EditableEntityName';
import { AddComponentMenu } from '@/editor/components/menus/AddComponentMenu';
import { useEntityInfo } from '@/editor/hooks/useEntityInfo';
import { useEditorStore } from '@/editor/store/editorStore';

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
  const [showAddComponent, setShowAddComponent] = useState(false);

  const selectedEntity = useEditorStore((s) => s.selectedId);
  const { entityId } = useEntityInfo(selectedEntity);

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-r border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300 overflow-hidden`}
    >
      {/* Panel collapse button when collapsed */}
      {isCollapsed && (
        <div
          className="flex-1 flex flex-col items-center justify-start pt-4 space-y-4 cursor-pointer"
          onClick={onToggleCollapse}
        >
          <div className="flex flex-col items-center space-y-2">
            <button
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
              title="Expand panel"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>

            {/* Vertical icons indicating the collapsed sections */}
            <div className="flex flex-col space-y-3 items-center">
              <div
                className="w-6 h-6 flex items-center justify-center bg-gray-800/50 rounded text-cyan-400"
                title="Hierarchy"
              >
                <FiLayers className="w-3 h-3" />
              </div>
              <div
                className="w-6 h-6 flex items-center justify-center bg-gray-800/50 rounded text-cyan-400"
                title="Inspector"
              >
                <FiSettings className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hierarchy Section */}
          <div
            className={`flex flex-col ${isHierarchyExpanded ? 'flex-shrink-0 max-h-[40vh]' : 'flex-shrink-0'} border-b border-gray-700/50`}
          >
            {/* Hierarchy Header */}
            <div className="h-10 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 flex items-center justify-between px-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

              <div className="relative z-10 flex items-center gap-2 flex-1">
                <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                  <FiLayers className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-gray-200 leading-none">Hierarchy</span>
              </div>

              <div className="relative z-10 flex items-center gap-1">
                <button
                  onClick={() => setIsHierarchyExpanded(!isHierarchyExpanded)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
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
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
                  title="Collapse panel"
                >
                  <FiChevronLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Hierarchy Content */}
            {isHierarchyExpanded && (
              <div className="flex-shrink-0 overflow-hidden">
                <div className="max-h-[calc(40vh-40px)] overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50 smooth-scroll">
                  {hierarchyContent}
                </div>
              </div>
            )}
          </div>

          {/* Inspector Section */}
          <div
            className={`flex flex-col ${isInspectorExpanded ? 'flex-1 min-h-0' : 'flex-shrink-0'}`}
          >
            {/* Inspector Header with Entity Info */}
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 px-3 py-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

              <div className="relative z-10 space-y-2">
                {/* Header Row with Title and Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                      <FiSettings className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-200 leading-none">
                      Inspector
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsInspectorExpanded(!isInspectorExpanded)}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200"
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

                {/* Entity Info Row - only show when expanded and entity selected */}
                {isInspectorExpanded && selectedEntity !== null && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">
                          ID:
                        </span>
                        <div className="bg-black/30 border border-gray-600/30 rounded px-1.5 py-0.5 flex-shrink-0">
                          <span className="text-[10px] font-mono text-cyan-300">{entityId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">
                          Name:
                        </span>
                        <div className="bg-black/30 border border-gray-600/30 rounded px-1.5 py-0.5 min-w-0 hover:bg-black/50 hover:border-blue-500/30 transition-all duration-200">
                          <EditableEntityName
                            entityId={selectedEntity}
                            enableClickToEdit={true}
                            className="text-[10px] text-gray-200 truncate"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compact Add Component Button */}
                    <button
                      onClick={() => setShowAddComponent(!showAddComponent)}
                      className={`flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium transition-all duration-200 rounded flex-shrink-0 ${
                        showAddComponent
                          ? 'bg-blue-600/80 text-blue-100 border border-blue-500/50'
                          : 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-300 border border-gray-600/50'
                      }`}
                      title="Add Component"
                    >
                      <FiPlus
                        className={`w-3 h-3 ${showAddComponent ? 'text-blue-200' : 'text-blue-400'}`}
                      />
                      <span>Add Component</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add Component Modal */}
            <AddComponentMenu
              entityId={selectedEntity}
              isOpen={showAddComponent}
              onClose={() => setShowAddComponent(false)}
            />

            {/* Inspector Content */}
            {isInspectorExpanded && (
              <div className="flex-1 flex-scroll-container">
                <div className="flex-scroll-content scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50 smooth-scroll">
                  {inspectorContent}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-cyan-500/30 cursor-col-resize group transition-colors duration-200">
        <div className="w-1 h-full bg-transparent group-hover:bg-cyan-500/50 transition-colors duration-200"></div>
      </div>
    </aside>
  );
};

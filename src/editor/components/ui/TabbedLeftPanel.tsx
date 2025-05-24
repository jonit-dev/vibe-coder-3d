import React, { ReactNode, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiLayers, FiSettings } from 'react-icons/fi';

export interface ITabbedLeftPanelProps {
  hierarchyContent: ReactNode;
  inspectorContent: ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TabbedLeftPanel: React.FC<ITabbedLeftPanelProps> = ({
  hierarchyContent,
  inspectorContent,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'inspector'>('hierarchy');

  const tabs = [
    {
      id: 'hierarchy' as const,
      label: 'Hierarchy',
      icon: <FiLayers className="w-4 h-4" />,
      content: hierarchyContent,
    },
    {
      id: 'inspector' as const,
      label: 'Inspector',
      icon: <FiSettings className="w-4 h-4" />,
      content: inspectorContent,
    },
  ];

  return (
    <aside
      className={`${isCollapsed ? 'w-12' : 'w-80'} bg-gradient-to-b from-[#0f0f10] to-[#1a1a1e] border-r border-gray-800/50 flex-shrink-0 flex flex-col h-full relative transition-all duration-300`}
    >
      {/* Panel header with tabs */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

        <div className="relative z-10">
          {!isCollapsed && (
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 h-10 px-3 flex items-center justify-center space-x-2 text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-b from-cyan-600/20 to-cyan-700/20 text-cyan-200 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Collapse button */}
          <button
            onClick={onToggleCollapse}
            className={`absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 rounded transition-all duration-200 ${
              isCollapsed ? 'top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2' : ''
            }`}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? (
              <FiChevronRight className="w-4 h-4" />
            ) : (
              <FiChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Panel content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
            {tabs.find((tab) => tab.id === activeTab)?.content}
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

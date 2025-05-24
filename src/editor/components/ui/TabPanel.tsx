import React, { ReactNode, useState } from 'react';

export interface ITab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface ITabPanelProps {
  tabs: ITab[];
  defaultActiveTab?: string;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

export const TabPanel: React.FC<ITabPanelProps> = ({
  tabs,
  defaultActiveTab,
  className = '',
  tabClassName = '',
  contentClassName = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || tabs[0]?.id || '');

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Headers */}
      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/5 to-purple-900/5 animate-pulse"></div>

        <div className="relative z-10 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 h-10 px-3 flex items-center justify-center space-x-2 text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-b from-cyan-600/20 to-cyan-700/20 text-cyan-200 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
              } ${tabClassName}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 overflow-hidden ${contentClassName}`}>
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 hover:scrollbar-thumb-gray-500/50">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </div>
    </div>
  );
};

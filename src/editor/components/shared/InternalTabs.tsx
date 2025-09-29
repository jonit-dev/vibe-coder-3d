import React, { ReactNode } from 'react';

export interface IInternalTab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface IInternalTabsProps {
  tabs: IInternalTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  // When true, content area scrolls; otherwise, parent manages scrolling
  scrollContent?: boolean;
}

export const InternalTabs: React.FC<IInternalTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  tabClassName = '',
  contentClassName = '',
  variant = 'default',
  size = 'md',
  scrollContent = true,
}) => {
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const getTabStyles = (tab: IInternalTab, isActive: boolean) => {
    const baseStyles = 'flex items-center space-x-2 transition-colors duration-200 font-medium';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    const variantStyles = {
      default: isActive
        ? 'bg-blue-600 text-white border-blue-600'
        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-white',
      pills: isActive
        ? 'bg-blue-600 text-white rounded-full'
        : 'bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 hover:text-white',
      underline: isActive
        ? 'text-blue-400 border-b-2 border-blue-400 bg-transparent'
        : 'text-gray-400 border-b-2 border-transparent hover:text-gray-200 bg-transparent',
    };

    const disabledStyles = tab.disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    const borderStyles = variant === 'default' ? 'border rounded-lg' : '';

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${borderStyles} ${disabledStyles} ${tabClassName}`;
  };

  const getContentStyles = () => {
    const baseStyles = `flex-1 min-h-0 ${scrollContent ? 'overflow-y-auto' : 'overflow-hidden'}`;
    return `${baseStyles} ${contentClassName}`;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className={`flex space-x-1 p-1 flex-shrink-0 ${variant === 'underline' ? 'border-b border-gray-600' : 'bg-gray-800 rounded-lg'}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              className={getTabStyles(tab, isActive)}
              disabled={tab.disabled}
            >
              {/* Icon */}
              {tab.icon && (
                <span className="flex-shrink-0">
                  {tab.icon}
                </span>
              )}

              {/* Label */}
              <span className="truncate">
                {tab.label}
              </span>

              {/* Badge */}
              {tab.badge && (
                <span className={`
                  inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full
                  ${isActive
                    ? 'bg-blue-500/20 text-blue-200'
                    : 'bg-gray-600 text-gray-300'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={getContentStyles()}>
        {activeTabData ? activeTabData.content : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-2">Tab not found</div>
              <div className="text-sm">The selected tab "{activeTab}" does not exist.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience hook for managing tab state
export const useInternalTabs = (defaultTab: string) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const changeTab = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return {
    activeTab,
    changeTab,
    setActiveTab,
  };
};

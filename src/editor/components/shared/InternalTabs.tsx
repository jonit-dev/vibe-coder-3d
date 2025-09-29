import React, { ReactNode, useEffect, useRef } from 'react';

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
  scrollContent?: boolean;
  allowTabScroll?: boolean;
}

export const useInternalTabs = (defaultTab: string, tabs: IInternalTab[] = []) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const changeTab = React.useCallback((tabId: string) => {
    if (tabs.length === 0) {
      // If tabs not provided, just set the tab without validation
      setActiveTab(tabId);
      return;
    }
    const tabExists = tabs.some(tab => tab.id === tabId && !tab.disabled);
    if (tabExists) {
      setActiveTab(tabId);
    }
  }, [tabs]);

  const getNextTab = React.useCallback(() => {
    const availableTabs = tabs.filter(tab => !tab.disabled);
    const currentTabInAvailable = availableTabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = (currentTabInAvailable + 1) % availableTabs.length;
    return availableTabs[nextIndex]?.id || activeTab;
  }, [tabs, activeTab]);

  const getPrevTab = React.useCallback(() => {
    const availableTabs = tabs.filter(tab => !tab.disabled);
    const currentTabInAvailable = availableTabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = currentTabInAvailable === 0 ? availableTabs.length - 1 : currentTabInAvailable - 1;
    return availableTabs[prevIndex]?.id || activeTab;
  }, [tabs, activeTab]);

  return {
    activeTab,
    changeTab,
    setActiveTab,
    getNextTab,
    getPrevTab,
  };
};

const useTabKeyboardNavigation = (
  tabs: IInternalTab[],
  activeTab: string,
  onTabChange: (tabId: string) => void
) => {
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if a tab button is focused
      const activeElement = document.activeElement as HTMLElement;
      if (!activeElement || !activeElement.hasAttribute('role') || activeElement.getAttribute('role') !== 'tab') {
        return;
      }
      if (!tabsRef.current?.contains(activeElement)) return;

      const availableTabs = tabs.filter(tab => !tab.disabled);
      const currentIndex = availableTabs.findIndex(tab => tab.id === activeTab);

      switch (event.key) {
        case 'ArrowLeft': {
          event.preventDefault();
          const prevIndex = currentIndex === 0 ? availableTabs.length - 1 : currentIndex - 1;
          onTabChange(availableTabs[prevIndex].id);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % availableTabs.length;
          onTabChange(availableTabs[nextIndex].id);
          break;
        }
        case 'Home': {
          event.preventDefault();
          onTabChange(availableTabs[0].id);
          break;
        }
        case 'End': {
          event.preventDefault();
          onTabChange(availableTabs[availableTabs.length - 1].id);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTab, onTabChange]);

  return { tabsRef };
};

const getTabStyles = (
  tab: IInternalTab,
  isActive: boolean,
  variant: IInternalTabsProps['variant'],
  size: IInternalTabsProps['size'],
  tabClassName: string
) => {
  const baseStyles = 'flex items-center gap-2 transition-all duration-200 font-medium whitespace-nowrap focus:outline-none';

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs min-w-0',
    md: 'px-3 py-1.5 text-sm min-w-0',
    lg: 'px-4 py-2 text-base min-w-0',
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

  return `${baseStyles} ${sizeStyles[size || 'md']} ${variantStyles[variant || 'default']} ${borderStyles} ${disabledStyles} ${tabClassName}`;
};

const getContentStyles = (scrollContent: boolean, contentClassName: string) => {
  // Ensure nested flex layouts can scroll without cutting off
  const baseStyles = `flex-1 min-h-0 ${scrollContent ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`;
  return `${baseStyles} ${contentClassName}`;
};

export const InternalTabs: React.FC<IInternalTabsProps> = React.memo(({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  tabClassName = '',
  contentClassName = '',
  variant = 'default',
  size = 'md',
  scrollContent = true,
  allowTabScroll = true,
}) => {
  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const { tabsRef } = useTabKeyboardNavigation(tabs, activeTab, onTabChange);

  const tabContainerClasses = variant === 'underline'
    ? 'border-b border-gray-600'
    : 'bg-gray-800 rounded-lg p-1';

  const tabScrollClasses = allowTabScroll
    ? 'overflow-x-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600'
    : 'overflow-x-hidden';

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Tab Navigation */}
      <div className={`flex-shrink-0 ${tabContainerClasses}`}>
        <div
          ref={tabsRef}
          className={`flex gap-1 ${tabScrollClasses}`}
          role="tablist"
          aria-orientation="horizontal"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                className={getTabStyles(tab, isActive, variant, size, tabClassName)}
                disabled={tab.disabled}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={tab.disabled ? -1 : 0}
              >
                {/* Icon */}
                {tab.icon && (
                  <span className="flex-shrink-0" aria-hidden="true">
                    {tab.icon}
                  </span>
                )}

                {/* Label */}
                <span className="truncate min-w-0">
                  {tab.label}
                </span>

                {/* Badge */}
                {tab.badge && (
                  <span className={`
                    inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0
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
      </div>

      {/* Tab Content */}
      <div
        className={getContentStyles(scrollContent, contentClassName)}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        id={`tabpanel-${activeTab}`}
      >
        {activeTabData ? activeTabData.content : (
          <div className="flex items-center justify-center h-full text-gray-400 p-4">
            <div className="text-center">
              <div className="text-lg mb-2">Tab not found</div>
              <div className="text-sm">The selected tab "{activeTab}" does not exist.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

import React, { useMemo, useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiEye,
  FiGlobe,
  FiHeadphones,
  FiMonitor,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSquare,
  FiTarget,
  FiTool,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';

import { useEntityComponents } from '@/core/hooks/useComponent';
import { ComponentGroupManager, IComponentGroup } from '@/core/lib/component-groups';
import { componentRegistry } from '@/core/lib/component-registry';
import { dynamicComponentManager } from '@/core/lib/dynamic-components';
import { ComponentCategory } from '@/core/types/component-registry';

interface IAddComponentMenuProps {
  entityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Category metadata with icons and descriptions
const CATEGORY_INFO = {
  [ComponentCategory.Core]: {
    icon: <FiTarget className="w-5 h-5" />,
    name: 'Core',
    description: 'Essential components',
  },
  [ComponentCategory.Rendering]: {
    icon: <FiEye className="w-5 h-5" />,
    name: 'Rendering',
    description: 'Visual appearance',
  },
  [ComponentCategory.Physics]: {
    icon: <FiZap className="w-5 h-5" />,
    name: 'Physics',
    description: 'Physics simulation',
  },
  [ComponentCategory.Gameplay]: {
    icon: <FiTool className="w-5 h-5" />,
    name: 'Gameplay',
    description: 'Game mechanics',
  },
  [ComponentCategory.AI]: {
    icon: <FiCpu className="w-5 h-5" />,
    name: 'AI',
    description: 'AI behavior',
  },
  [ComponentCategory.Audio]: {
    icon: <FiHeadphones className="w-5 h-5" />,
    name: 'Audio',
    description: 'Sound effects',
  },
  [ComponentCategory.UI]: {
    icon: <FiMonitor className="w-5 h-5" />,
    name: 'UI',
    description: 'User interface',
  },
  [ComponentCategory.Network]: {
    icon: <FiGlobe className="w-5 h-5" />,
    name: 'Network',
    description: 'Multiplayer',
  },
} as const;

// Icon mapping for component groups
const getGroupIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    FiZap: <FiZap className="w-4 h-4" />,
    FiTrendingUp: <FiTrendingUp className="w-4 h-4" />,
    FiSquare: <FiSquare className="w-4 h-4" />,
    FiEye: <FiEye className="w-4 h-4" />,
    FiTarget: <FiTarget className="w-4 h-4" />,
    FiPackage: <FiPackage className="w-4 h-4" />,
    // Fallback for emojis
    '⚛️': <FiZap className="w-4 h-4" />,
    '⚡': <FiTrendingUp className="w-4 h-4" />,
    '🧿': <FiZap className="w-4 h-4" />,
    '🚪': <FiSquare className="w-4 h-4" />,
    '🎨': <FiEye className="w-4 h-4" />,
    '🎯': <FiTarget className="w-4 h-4" />,
    '📦': <FiPackage className="w-4 h-4" />,
  };
  return iconMap[iconName] || <FiPackage className="w-4 h-4" />;
};

export const AddComponentMenu: React.FC<IAddComponentMenuProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState<string | null>(null);
  const [showAllCurrentComponents, setShowAllCurrentComponents] = useState(false);

  const entityComponents = useEntityComponents(entityId);

  // Debug logging
  console.log('AddComponentMenu Debug:', {
    entityId,
    isOpen,
    entityComponents,
    entityComponentsLength: entityComponents.length,
  });

  // Get available components
  const availableComponents = useMemo(() => {
    if (!entityId) return [];
    const allComponents = componentRegistry.getAllComponents();
    return allComponents
      .filter((component) => !entityComponents.includes(component.id))
      .filter((component) => !component.required) // Don't show required components
      .filter((component) => component.id !== 'name' && component.name !== 'Name'); // Don't show Name component
  }, [entityId, entityComponents]);

  // Get available component groups
  const availableGroups = useMemo(() => {
    if (!entityId) return [];
    return ComponentGroupManager.getAllGroups().filter((group) =>
      ComponentGroupManager.canAddGroupToEntity(entityId, group.id),
    );
  }, [entityId, entityComponents]);

  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    let filtered = availableComponents;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (comp) =>
          comp.name.toLowerCase().includes(search) ||
          comp.metadata?.description?.toLowerCase().includes(search),
      );
    }

    if (selectedCategory !== null) {
      filtered = filtered.filter((comp) => comp.category === selectedCategory);
    }

    return filtered;
  }, [availableComponents, searchTerm, selectedCategory]);

  // Filter groups based on search and category
  const filteredGroups = useMemo(() => {
    let filtered = availableGroups;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(search) ||
          group.description.toLowerCase().includes(search),
      );
    }

    if (selectedCategory !== null) {
      filtered = filtered.filter((group) => group.category === selectedCategory);
    }

    return filtered;
  }, [availableGroups, searchTerm, selectedCategory]);

  const handleAddComponent = async (componentId: string) => {
    if (!entityId) return;

    try {
      const result = await dynamicComponentManager.addComponent(entityId, componentId);
      if (result.valid) {
        console.log(`✅ Added component '${componentId}' to entity ${entityId}`);
        onClose();
      } else {
        console.error(`❌ Failed to add component '${componentId}':`, result.errors);
      }
    } catch (error) {
      console.error('Failed to add component:', error);
    }
  };

  const handleAddGroup = async (group: IComponentGroup) => {
    if (!entityId) return;

    setIsAddingGroup(group.id);
    try {
      const result = await ComponentGroupManager.addGroupToEntity(entityId, group.id);
      if (result.success) {
        console.log(`✅ Added component group '${group.name}' to entity ${entityId}`);
        onClose();
      } else {
        console.error('Failed to add component group:', result.errors);
      }
    } catch (error) {
      console.error('Error adding component group:', error);
    } finally {
      setIsAddingGroup(null);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSearchTerm('');
  };

  if (!isOpen || !entityId) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-96 max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-600">
          <div className="flex items-center gap-2">
            {selectedCategory !== null && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              >
                <FiChevronLeft />
              </button>
            )}
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {selectedCategory !== null ? (
                <>
                  {CATEGORY_INFO[selectedCategory].icon}
                  {CATEGORY_INFO[selectedCategory].name}
                  <span className="text-xs text-gray-400">
                    ({filteredComponents.length + filteredGroups.length} available)
                  </span>
                </>
              ) : (
                '+ Add Component'
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <FiX />
          </button>
        </div>

        {/* Search - Moved to top */}
        <div className="p-3 border-b border-gray-600">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {!selectedCategory && (
            <div className="text-xs text-gray-400 mt-2">
              💡 Browse by category below or search for specific components
            </div>
          )}
        </div>

        {/* Current Components Summary - Improved for many items */}
        <div className="border-b border-gray-600 bg-gray-800/50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-gray-300">
                Currently Added ({entityComponents.length}) - Entity ID: {entityId}
              </div>
              {entityComponents.length > 6 && (
                <button
                  onClick={() => setShowAllCurrentComponents(!showAllCurrentComponents)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showAllCurrentComponents ? 'Show Less' : 'Show All'}
                </button>
              )}
            </div>
            {entityComponents.length > 0 ? (
              <div
                className={`scrollbar-thin scrollbar-track-gray-800/50 scrollbar-thumb-gray-600/50 ${
                  entityComponents.length > 6 && !showAllCurrentComponents
                    ? 'max-h-16 overflow-hidden'
                    : 'max-h-32 overflow-y-auto'
                }`}
              >
                <div className="flex flex-wrap gap-1">
                  {entityComponents.map((componentId, index) => {
                    const component = componentRegistry.getComponent(componentId);
                    const shouldShow = showAllCurrentComponents || index < 6;

                    if (!shouldShow && entityComponents.length > 6) {
                      if (index === 6) {
                        const hiddenComponents = entityComponents.slice(6).map((componentId) => {
                          const component = componentRegistry.getComponent(componentId);
                          return component?.name || componentId;
                        });

                        return (
                          <div key="more-indicator" className="relative group cursor-help">
                            <div className="px-2 py-1 bg-gray-600/20 border border-gray-500/30 rounded text-xs text-gray-400 flex items-center gap-1">
                              +{entityComponents.length - 6} more...
                            </div>
                            {/* Tailwind Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg border border-gray-700">
                              Hidden: {hiddenComponents.join(', ')}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }

                    return (
                      <div
                        key={componentId}
                        className="px-2 py-1 bg-green-600/20 border border-green-500/30 rounded text-xs text-green-300 flex items-center gap-1"
                        title={component?.metadata?.description || componentId}
                      >
                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                        {component?.name || componentId}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                No components added yet (Debug: entityComponents ={' '}
                {JSON.stringify(entityComponents)})
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {selectedCategory === null ? (
            /* Category List */
            <div className="p-2">
              {/* Quick Stats */}
              <div className="mb-3 p-2 bg-gray-800/50 rounded border border-gray-600">
                <div className="text-xs font-medium text-gray-300 mb-1">Available to Add</div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{availableComponents.length} Components</span>
                  <span>{availableGroups.length} Component Groups</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Debug: Total registered = {componentRegistry.getAllComponents().length}
                </div>
              </div>

              {(Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>).map((category) => {
                const categoryEnum = category;
                const info = CATEGORY_INFO[category];
                const componentCount = availableComponents.filter(
                  (c) => c.category === categoryEnum,
                ).length;
                const groupCount = availableGroups.filter(
                  (g) => g.category === categoryEnum,
                ).length;
                const totalCount = componentCount + groupCount;

                if (totalCount === 0 && !searchTerm) return null;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(categoryEnum)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-700 rounded text-left group transition-all duration-200 border border-transparent hover:border-gray-600"
                    title={`Browse ${info.name} components`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-blue-400 p-1 bg-blue-400/10 rounded">{info.icon}</div>
                      <div>
                        <div className="text-white text-sm font-medium">{info.name}</div>
                        <div className="text-gray-400 text-xs">{info.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end text-xs">
                        <span className="text-gray-300 font-medium">{totalCount}</span>
                        <span className="text-gray-500">available</span>
                      </div>
                      <FiChevronRight className="text-gray-400 group-hover:text-white w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Component List for Selected Category */
            <div className="p-2">
              {/* Component Groups Section */}
              {filteredGroups.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 py-1 mb-2">
                    <FiPackage className="inline mr-1" />
                    Component Packages
                  </div>
                  {filteredGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handleAddGroup(group)}
                      disabled={isAddingGroup === group.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded text-left group disabled:opacity-50 transition-all duration-200 border border-transparent hover:border-gray-600"
                      title={`Add ${group.name} component group`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center">
                        {getGroupIcon(group.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-white font-medium text-sm">{group.name}</div>
                          <div className="px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-[10px] text-blue-300">
                            GROUP
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs mb-1">{group.description}</div>
                        <div className="text-xs text-blue-400 flex items-center gap-1">
                          <span>📦</span>
                          <span>
                            Includes: {group.components.slice(0, 3).join(', ')}
                            {group.components.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isAddingGroup === group.id ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPlus className="text-gray-400 group-hover:text-green-400 w-4 h-4 transition-colors" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Individual Components Section */}
              {filteredComponents.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 py-1 mb-2">
                    Individual Components
                  </div>
                  {filteredComponents.map((component) => {
                    const categoryInfo = CATEGORY_INFO[component.category];
                    return (
                      <button
                        key={component.id}
                        onClick={() => handleAddComponent(component.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded text-left group transition-all duration-200 border border-transparent hover:border-gray-600"
                        title={`Add ${component.name} component`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded flex items-center justify-center">
                          <span className="text-xs text-white font-semibold">
                            {component.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-white font-medium text-sm">{component.name}</div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {categoryInfo?.icon && (
                                <span className="w-3 h-3">{categoryInfo.icon}</span>
                              )}
                              <span>{categoryInfo?.name}</span>
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs mb-1">
                            {component.metadata?.description || 'No description available'}
                          </div>
                          {component.dependencies && component.dependencies.length > 0 && (
                            <div className="text-xs text-orange-400 flex items-center gap-1">
                              <span>⚠️</span>
                              <span>Requires: {component.dependencies.join(', ')}</span>
                            </div>
                          )}
                          {component.required && (
                            <div className="text-xs text-blue-400 flex items-center gap-1">
                              <span>🔒</span>
                              <span>Core component</span>
                            </div>
                          )}
                        </div>
                        <FiPlus className="text-gray-400 group-hover:text-green-400 w-4 h-4 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {filteredComponents.length === 0 && filteredGroups.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-3">{searchTerm ? '🔍' : '✅'}</div>
                  <div className="font-medium mb-2">
                    {searchTerm ? 'No matching components found' : 'All components already added'}
                  </div>
                  <div className="text-sm max-w-xs mx-auto">
                    {searchTerm
                      ? 'Try adjusting your search terms or browse other categories'
                      : 'All available components in this category have been added to your entity'}
                  </div>
                  {!searchTerm && (
                    <button
                      onClick={handleBack}
                      className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Browse Other Categories
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

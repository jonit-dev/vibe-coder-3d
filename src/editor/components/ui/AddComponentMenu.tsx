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

  const entityComponents = useEntityComponents(entityId);

  // Get available components
  const availableComponents = useMemo(() => {
    if (!entityId) return [];
    const allComponents = componentRegistry.getAllComponents();
    return allComponents
      .filter((component) => !entityComponents.includes(component.id))
      .filter((component) => !component.required); // Don't show required components
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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[100]">
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

        {/* Search */}
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedCategory === null ? (
            /* Category List */
            <div className="p-2">
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
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-700 rounded text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-blue-400">{info.icon}</div>
                      <div>
                        <div className="text-white text-sm font-medium">{info.name}</div>
                        <div className="text-gray-400 text-xs">{info.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-xs">{totalCount}</span>
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
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-left group disabled:opacity-50"
                    >
                      <div className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
                        {getGroupIcon(group.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{group.name}</div>
                        <div className="text-gray-400 text-xs">{group.description}</div>
                        <div className="text-xs text-blue-400 truncate">
                          {group.components.join(', ')}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isAddingGroup === group.id ? (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FiPlus className="text-gray-400 group-hover:text-white w-4 h-4" />
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
                  {filteredComponents.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => handleAddComponent(component.id)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-700 rounded text-left group"
                    >
                      <div className="flex-shrink-0 w-7 h-7 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">
                          {component.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{component.name}</div>
                        <div className="text-gray-400 text-xs truncate">
                          {component.metadata?.description || 'No description available'}
                        </div>
                        {component.dependencies && component.dependencies.length > 0 && (
                          <div className="text-xs text-yellow-400 truncate">
                            Requires: {component.dependencies.join(', ')}
                          </div>
                        )}
                      </div>
                      <FiPlus className="text-gray-400 group-hover:text-white w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredComponents.length === 0 && filteredGroups.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="font-medium">No components available</div>
                  <div className="text-sm">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'All components in this category are already added'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { FiBox, FiPackage, FiSearch, FiX } from 'react-icons/fi'; // Removed unused icons FiEye, FiMove, FiShield, FiZap, TbCube

import { isValidEntityId } from '@/core/lib/ecs/utils';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
// import { useEntityData } from '@/editor/hooks/useEntityData'; // Not used after refactor
import {
  getAllComponentDefinitions,
  getComponentDefaultData,
  AUTO_COMPONENT_PACKS,
  getComponentsByCategory as getRegistryComponentsByCategory, // Renamed to avoid conflict
} from '@core/lib/ecs/dynamicComponentRegistry';
import { ComponentManifest } from '@core/components/types'; // For typing
import { IComponentPack } from '@core/lib/ecs/types'; // Assuming IComponentPack is here

/**
 * Add Component Menu System
 *
 * This module provides two versions of the component menu:
 *
 * 1. **AddComponentMenu** (Full Modal Version)
 *    - Full-screen modal overlay with tabs for components and packs
 *    - Shows current components with overflow tooltips
 *    - Search functionality across all components and packs
 *    - Detailed component information and icons
 *    - Best for: Standalone use when triggered by buttons in the main UI
 *
 * 2. **CompactAddComponentMenu** (Inline Version)
 *    - Compact inline version for use within panels
 *    - Combined list of packs and components (packs shown first)
 *    - Search functionality with simplified layout
 *    - Best for: Embedding within inspector panels or sidebars
 *
 * Features:
 * - **Component Packs**: Pre-configured sets of related components
 *   - Physics Basics: RigidBody + MeshCollider
 *   - Complete Entity: Transform + MeshRenderer
 *   - Physics Entity: All components for a physics-enabled entity
 * - **Search**: Filter by component/pack name or description
 * - **Icons**: Visual representation for each component type
 * - **Current Component Display**: Shows attached components with overflow tooltips
 * - **Smart Defaults**: Automatically configured default values for each component type
 *
 * Usage:
 * ```tsx
 * // Full modal version
 * <AddComponentMenu
 *   entityId={selectedEntityId}
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 * />
 *
 * // Compact inline version
 * <CompactAddComponentMenu
 *   entityId={selectedEntityId}
 *   isOpen={showInlineMenu}
 *   onClose={() => setShowInlineMenu(false)}
 * />
 * ```
 */

interface IAddComponentMenuProps {
  entityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Removed local IComponentDefinition and IComponentPack, will use ComponentManifest from core types
// Removed local COMPONENT_DEFINITIONS and COMPONENT_PACKS

export const AddComponentMenu: React.FC<IAddComponentMenuProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const componentManager = useComponentManager();
  // const { getComponentData } = useEntityData(); // Not used after refactor
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'components' | 'packs'>('components');

  // Removed local getDefaultMaterialData, default data now comes from manifest.getDefaultData()

  const entityComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    return componentManager.getComponentsForEntity(entityId);
  }, [entityId, componentManager]);

  const allManifests = useMemo(() => getAllComponentDefinitions(), []);
  const allPacks = useMemo(() => AUTO_COMPONENT_PACKS as IComponentPack[], []); // Cast if necessary, ensure AUTO_COMPONENT_PACKS matches IComponentPack structure

  const availableComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = new Set(entityComponents.map((c) => c.type));
    return allManifests.filter((manifest) => !existingTypes.has(manifest.id));
  }, [entityId, entityComponents, allManifests]);

  const availablePacks = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = new Set(entityComponents.map((c) => c.type));
    return allPacks.filter((pack) =>
      pack.components.some((compId) => !existingTypes.has(compId)),
    );
  }, [entityId, entityComponents, allPacks]);

  // Filter by search term
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return availableComponents;
    const term = searchTerm.toLowerCase();
    return availableComponents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) ||
        comp.description.toLowerCase().includes(term) ||
        comp.category.toLowerCase().includes(term),
    );
  }, [availableComponents, searchTerm]);

  const filteredPacks = useMemo(() => {
    if (!searchTerm) return availablePacks;
    const term = searchTerm.toLowerCase();
    return availablePacks.filter(
      (pack) =>
        pack.name.toLowerCase().includes(term) ||
        pack.description.toLowerCase().includes(term) ||
        pack.category.toLowerCase().includes(term),
    );
  }, [availablePacks, searchTerm]);

  // Group components by category
  const componentsByCategory = useMemo(() => {
    const categories: Record<string, ComponentManifest<any>[]> = {};
    filteredComponents.forEach((manifest) => {
      if (!categories[manifest.category]) {
        categories[manifest.category] = [];
      }
      categories[manifest.category].push(manifest);
    });
    return categories;
  }, [filteredComponents]);

  const packsByCategory = useMemo(() => {
    const categories: Record<string, IComponentPack[]> = {};
    filteredPacks.forEach((pack) => {
      if (!categories[pack.category]) {
        categories[pack.category] = [];
      }
      categories[pack.category].push(pack);
    });
    return categories;
  }, [filteredPacks]);

  const handleAddComponent = (componentId: string) => {
    if (!isValidEntityId(entityId)) return;

    const defaultData = getComponentDefaultData(componentId);
    if (Object.keys(defaultData).length === 0 && !allManifests.find(m => m.id === componentId)?.getDefaultData) {
        // This check is primarily for components that might not yet be refactored and are not in AUTO_COMPONENT_REGISTRY
        // or if getComponentDefaultData returned empty due to some issue.
        console.warn(`[AddComponentMenu] Could not get default data for component ID: ${componentId}. Adding with empty data.`);
    }

    componentManager.addComponent(entityId, componentId, defaultData);
    onClose();
  };

  const handleAddPack = (pack: IComponentPack) => {
    if (!isValidEntityId(entityId)) return;

    const existingTypes = entityComponents.map((c) => c.type);

    // Add each component in the pack that doesn't already exist
    pack.components.forEach((componentType) => {
      if (!existingTypes.includes(componentType)) {
        handleAddComponent(componentType);
      }
    });
  };

  // Display current components with overflow handling
  const renderCurrentComponents = () => {
    const maxVisible = 3;
    const visibleComponents = entityComponents.slice(0, maxVisible);
    const hiddenCount = Math.max(0, entityComponents.length - maxVisible);

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {visibleComponents.map((component) => {
          const manifest = allManifests.find((m) => m.id === component.type);
          return (
            <div
              key={component.type}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600/50 rounded text-xs"
              title={manifest?.description || component.type}
            >
              {manifest?.icon || <FiBox className="w-3 h-3" />}
              <span className="text-gray-300">{manifest?.name || component.type}</span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div
            className="flex items-center px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-xs text-gray-400 cursor-help"
            title={`+${hiddenCount} more: ${entityComponents
              .slice(maxVisible)
              .map((c) => {
                const manifest = allManifests.find((m) => m.id === c.type);
                return manifest?.name || c.type;
              })
              .join(', ')}`}
          >
            +{hiddenCount} more
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !isValidEntityId(entityId)) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-gray-800 rounded-lg border border-gray-600 w-[500px] max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <FiPackage className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Add Component</h3>
              <p className="text-xs text-gray-400">Entity {entityId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Current Components */}
        <div className="p-4 border-b border-gray-600/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Current Components</span>
            <span className="text-xs text-gray-500">{entityComponents.length} total</span>
          </div>
          {entityComponents.length > 0 ? (
            renderCurrentComponents()
          ) : (
            <div className="text-xs text-gray-500">No components attached</div>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-600/50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search components and packs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600/50">
          <button
            onClick={() => setSelectedTab('components')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'components'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-700/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Individual Components
          </button>
          <button
            onClick={() => setSelectedTab('packs')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              selectedTab === 'packs'
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-gray-700/30'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Component Packs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
          {selectedTab === 'components' ? (
            Object.keys(componentsByCategory).length > 0 ? (
              Object.entries(componentsByCategory).map(([category, components]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {components.map((component) => (
                      <button
                        key={component.id}
                        onClick={() => handleAddComponent(component.id)}
                        className="w-full text-left p-3 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                            {/* Ensure manifest.icon is a ReactNode. If it's a string or path, handle appropriately */}
                            {typeof component.icon === 'function' ? component.icon({}) : component.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white group-hover:text-gray-100">
                              {component.name}
                            </div>
                            <div className="text-xs text-gray-400 group-hover:text-gray-300">
                              {component.description} {/* Ensure description is a string */}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">
                  {searchTerm
                    ? `No components found for "${searchTerm}"`
                    : 'All available components have been added'}
                </div>
              </div>
            )
          ) : Object.keys(packsByCategory).length > 0 ? (
            Object.entries(packsByCategory).map(([category, packs]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
                  {category} Packs
                </h4>
                <div className="space-y-2">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      onClick={() => handleAddPack(pack)}
                      className="w-full text-left p-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/50 hover:to-gray-500/50 border border-gray-600/50 hover:border-gray-500/50 rounded-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 text-purple-400 group-hover:text-purple-300 transition-colors">
                             {/* Ensure pack.icon is a ReactNode */}
                             {typeof pack.icon === 'function' ? pack.icon({}) : pack.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-gray-100">
                            {pack.name}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-gray-300 mb-1">
                              {pack.description} {/* Ensure description is a string */}
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {pack.components.map((compId) => {
                                const manifest = allManifests.find((m) => m.id === compId);
                              return (
                                <span
                                  key={compId}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/20 border border-gray-500/30 rounded text-xs text-gray-300"
                                >
                                    {manifest?.icon || <FiBox className="w-3 h-3" />}
                                    {manifest?.name || compId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-sm">
                {searchTerm
                  ? `No component packs found for "${searchTerm}"`
                  : 'No component packs available'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-750 border-t border-gray-600 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>
              Entity {entityId} • {entityComponents.length} components
            </span>
            <span className="text-gray-500">
              {selectedTab === 'components'
                ? `${Object.values(componentsByCategory).flat().length} available`
                : `${Object.values(packsByCategory).flat().length} packs available`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Compact version for inline use in panels
interface ICompactAddComponentMenuProps {
  entityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompactAddComponentMenu: React.FC<ICompactAddComponentMenuProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const componentManager = useComponentManager();
  // const { getComponentData } = useEntityData(); // Not used
  const [searchTerm, setSearchTerm] = useState('');

  // Removed local getDefaultMaterialData

  const entityComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    return componentManager.getComponentsForEntity(entityId);
  }, [entityId, componentManager]);

  const allManifests = useMemo(() => getAllComponentDefinitions(), []);
  const allPacks = useMemo(() => AUTO_COMPONENT_PACKS as IComponentPack[], []);

  const availableComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = new Set(entityComponents.map((c) => c.type));
    return allManifests.filter((manifest) => !existingTypes.has(manifest.id));
  }, [entityId, entityComponents, allManifests]);

  const availablePacks = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = new Set(entityComponents.map((c) => c.type));
    return allPacks.filter((pack) =>
      pack.components.some((compId) => !existingTypes.has(compId)),
    );
  }, [entityId, entityComponents, allPacks]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const components = availableComponents.filter(
      (manifest) =>
        manifest.name.toLowerCase().includes(term) || manifest.description.toLowerCase().includes(term),
    );
    const packs = availablePacks.filter(
      (pack) =>
        pack.name.toLowerCase().includes(term) || pack.description.toLowerCase().includes(term),
    );
    // Type assertion to treat ComponentManifest and IComponentPack as a common type for the list
    return [...packs, ...components] as (ComponentManifest<any> | IComponentPack)[];
  }, [availableComponents, availablePacks, searchTerm]);

  const handleAddComponent = (componentId: string) => {
    if (!isValidEntityId(entityId)) return;
    const defaultData = getComponentDefaultData(componentId);
     if (Object.keys(defaultData).length === 0 && !allManifests.find(m => m.id === componentId)?.getDefaultData) {
        console.warn(`[CompactAddComponentMenu] Could not get default data for component ID: ${componentId}. Adding with empty data.`);
    }
    componentManager.addComponent(entityId, componentId, defaultData);
    onClose();
  };

  const handleAddPack = (pack: IComponentPack) => {
    if (!isValidEntityId(entityId)) return;

    const existingTypes = entityComponents.map((c) => c.type);

    // Add each component in the pack that doesn't already exist
    pack.components.forEach((componentType) => {
      if (!existingTypes.includes(componentType)) {
        handleAddComponent(componentType);
      }
    });
  };

  const handleItemClick = (item: ComponentManifest<any> | IComponentPack) => {
    if ('components' in item) { // Check if it's an IComponentPack by looking for 'components' property
      handleAddPack(item as IComponentPack);
    } else { // Otherwise, it's a ComponentManifest
      handleAddComponent(item.id);
    }
  };

  if (!isOpen || !isValidEntityId(entityId)) return null;

  return (
    <div className="bg-gray-750/50 border border-gray-600/50 rounded-lg p-3">
      {/* Search Bar */}
      <div className="relative mb-3">
        <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </div>

      {/* Items List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isPack = 'components' in item;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full text-left p-2 rounded border transition-all duration-200 group ${
                  isPack
                    ? 'bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-600/30 hover:from-purple-800/30 hover:to-purple-700/30 hover:border-purple-500/50'
                    : 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-600/50 hover:border-gray-500/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex-shrink-0 transition-colors ${
                      isPack
                        ? 'text-purple-400 group-hover:text-purple-300'
                        : 'text-cyan-400 group-hover:text-cyan-300'
                    }`}
                  >
                    {/* Ensure item.icon is ReactNode */}
                    {typeof item.icon === 'function' ? item.icon({}) : item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white group-hover:text-gray-100 truncate">
                      {item.name}
                      {isPack && <span className="text-purple-300 ml-1">(Pack)</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 group-hover:text-gray-300 truncate">
                      {item.description} {/* Ensure description is string */}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">
            {searchTerm
              ? `No components found for "${searchTerm}"`
              : 'All components have been added'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-gray-600/30 text-[10px] text-gray-500">
        {filteredItems.length} available • {entityComponents.length} attached
      </div>
    </div>
  );
};

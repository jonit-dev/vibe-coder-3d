import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBox,
  FiCamera,
  FiCode,
  FiEye,
  FiFilm,
  FiMove,
  FiPackage,
  FiSearch,
  FiShield,
  FiSun,
  FiUser,
  FiVolume2,
  FiX,
  FiZap,
} from 'react-icons/fi';
import { TbCube } from 'react-icons/tb';

import { useEvent } from '@/core/hooks/useEvent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { isValidEntityId } from '@/core/lib/ecs/utils';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityData } from '@/editor/hooks/useEntityData';

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

// Component definitions with icons and metadata
interface IComponentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  requiredComponents?: string[]; // Components that must exist for this component to be added
  incompatibleComponents?: string[]; // Components that cannot coexist with this one
}

// Component pack definitions
interface IComponentPack {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  components: string[];
  category: string;
}

const COMPONENT_DEFINITIONS: IComponentDefinition[] = [
  {
    id: KnownComponentTypes.TRANSFORM,
    name: 'Transform',
    description: 'Position, rotation, and scale',
    icon: <FiMove className="w-4 h-4" />,
    category: 'Core',
  },
  {
    id: KnownComponentTypes.MESH_RENDERER,
    name: 'Mesh Renderer',
    description: 'Renders 3D mesh geometry',
    icon: <FiEye className="w-4 h-4" />,
    category: 'Rendering',
    incompatibleComponents: ['Camera'],
  },
  {
    id: KnownComponentTypes.RIGID_BODY,
    name: 'Rigid Body',
    description: 'Physics simulation body with dynamic/kinematic/static types',
    icon: <FiZap className="w-4 h-4" />,
    category: 'Physics',
    // RigidBody can coexist with CharacterController (CharacterController can push dynamic bodies)
  },
  {
    id: KnownComponentTypes.MESH_COLLIDER,
    name: 'Mesh Collider',
    description: 'Physics collision detection',
    icon: <FiShield className="w-4 h-4" />,
    category: 'Physics',
  },
  {
    id: 'Camera',
    name: 'Camera',
    description: 'Camera for rendering perspectives',
    icon: <FiCamera className="w-4 h-4" />,
    category: 'Rendering',
    incompatibleComponents: ['MeshRenderer'],
  },
  {
    id: KnownComponentTypes.LIGHT,
    name: 'Light',
    description: 'Light source for illuminating scenes',
    icon: <FiSun className="w-4 h-4" />,
    category: 'Rendering',
    incompatibleComponents: ['MeshRenderer'],
  },
  {
    id: KnownComponentTypes.SCRIPT,
    name: 'Script',
    description: 'Custom JavaScript/TypeScript scripting with entity access',
    icon: <FiCode className="w-4 h-4" />,
    category: 'Gameplay',
  },
  {
    id: KnownComponentTypes.SOUND,
    name: 'Sound',
    description: '3D spatial audio with playback controls',
    icon: <FiVolume2 className="w-4 h-4" />,
    category: 'Audio',
  },
  {
    id: KnownComponentTypes.ANIMATION,
    name: 'Animation',
    description: 'Animation playback with timeline and keyframe support',
    icon: <FiFilm className="w-4 h-4" />,
    category: 'Rendering',
  },
  {
    id: KnownComponentTypes.CHARACTER_CONTROLLER,
    name: 'Character Controller',
    description: 'Character movement controller with physics-based collision',
    icon: <FiUser className="w-4 h-4" />,
    category: 'Gameplay',
    requiredComponents: ['MeshCollider'], // CharacterController requires a collider for physics queries
  },
];

const COMPONENT_PACKS: IComponentPack[] = [
  {
    id: 'physics-basics',
    name: 'Physics Basics',
    description: 'Rigid body + mesh collider for basic physics',
    icon: <FiZap className="w-4 h-4" />,
    components: [KnownComponentTypes.RIGID_BODY, KnownComponentTypes.MESH_COLLIDER],
    category: 'Physics',
  },
  {
    id: 'rendering-basics',
    name: 'Rendering Basics',
    description: 'Complete rendering setup',
    icon: <TbCube className="w-4 h-4" />,
    components: [KnownComponentTypes.MESH_RENDERER],
    category: 'Rendering',
  },
  {
    id: 'complete-entity',
    name: 'Complete Entity',
    description: 'Transform + rendering for a complete visible entity',
    icon: <FiPackage className="w-4 h-4" />,
    components: [KnownComponentTypes.TRANSFORM, KnownComponentTypes.MESH_RENDERER],
    category: 'Core',
  },
  {
    id: 'physics-entity',
    name: 'Physics Entity',
    description: 'Complete physics-enabled entity with rendering',
    icon: <FiBox className="w-4 h-4" />,
    components: [
      KnownComponentTypes.TRANSFORM,
      KnownComponentTypes.MESH_RENDERER,
      KnownComponentTypes.RIGID_BODY,
      KnownComponentTypes.MESH_COLLIDER,
    ],
    category: 'Physics',
  },
];

export const AddComponentMenu: React.FC<IAddComponentMenuProps> = ({
  entityId,
  isOpen,
  onClose,
}) => {
  const componentManager = useComponentManager();
  const { getComponentData } = useEntityData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'components' | 'packs'>('components');

  // Helper function to get default material data
  const getDefaultMaterialData = (entityId: number) => {
    const materialData = getComponentData(entityId, 'material') as Record<string, unknown> | null;
    if (materialData?.color) {
      if (Array.isArray(materialData.color)) {
        const [r, g, b] = materialData.color as unknown as number[];
        const color = `#${Math.round(r * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(g * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(b * 255)
          .toString(16)
          .padStart(2, '0')}`;
        return { color };
      } else if (typeof (materialData as any).color === 'string') {
        return { color: (materialData as any).color as string };
      }
    }
    // No overrides by default to prioritize default material
    return {} as any;
  };

  // Get components for this entity using new ECS system with reactive updates
  const [entityComponents, setEntityComponents] = useState<
    Array<{ entityId: number; type: string; data: unknown }>
  >([]);

  // Update components when entity changes or components are modified
  const updateEntityComponents = useCallback(() => {
    if (!isValidEntityId(entityId)) {
      setEntityComponents([]);
      return;
    }
    const components = componentManager.getComponentsForEntity(entityId);
    setEntityComponents(components);
  }, [entityId, componentManager]);

  // Listen for component events to update reactively
  useEffect(() => {
    updateEntityComponents();
  }, [updateEntityComponents]);

  // Listen for component events using the global event system
  useEvent('component:added', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  // Get available components from KnownComponentTypes
  const availableComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = entityComponents.map((c) => c.type);

    return COMPONENT_DEFINITIONS.filter((comp) => {
      // Don't show if already exists
      if (existingTypes.includes(comp.id)) return false;

      // Check for incompatible components using the component definition
      const hasIncompatibleComponent = existingTypes.some((existingType) => {
        // Check if this component is incompatible with any existing component
        if (comp.incompatibleComponents?.includes(existingType)) {
          return true;
        }

        // Check if any existing component is incompatible with this component
        const existingCompDef = COMPONENT_DEFINITIONS.find((c) => c.id === existingType);
        if (existingCompDef?.incompatibleComponents?.includes(comp.id)) {
          return true;
        }

        return false;
      });

      return !hasIncompatibleComponent;
    });
  }, [entityId, entityComponents]);

  // Get available component packs
  const availablePacks = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = entityComponents.map((c) => c.type);

    return COMPONENT_PACKS.filter((pack) =>
      pack.components.some((compId) => !existingTypes.includes(compId)),
    );
  }, [entityId, entityComponents]);

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
    const categories: Record<string, IComponentDefinition[]> = {};
    filteredComponents.forEach((comp) => {
      if (!categories[comp.category]) {
        categories[comp.category] = [];
      }
      categories[comp.category].push(comp);
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

  const handleAddComponent = (componentType: string) => {
    if (!isValidEntityId(entityId)) return;

    // Add component with default data based on type
    let defaultData = {};
    switch (componentType) {
      case KnownComponentTypes.TRANSFORM:
        defaultData = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
        break;
      case KnownComponentTypes.MESH_RENDERER: {
        defaultData = {
          meshId: 'cube',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          ...(() => {
            const mat = getDefaultMaterialData(entityId);
            return Object.keys(mat).length ? { material: mat } : {};
          })(),
        };
        break;
      }
      case KnownComponentTypes.RIGID_BODY:
        defaultData = {
          type: 'dynamic',
          mass: 1,
          enabled: true,
          bodyType: 'dynamic',
          gravityScale: 1,
          canSleep: true,
          material: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        };
        break;
      case KnownComponentTypes.MESH_COLLIDER:
        defaultData = {
          enabled: true,
          colliderType: 'box',
          isTrigger: false,
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        };
        break;
      case KnownComponentTypes.LIGHT:
        defaultData = {
          lightType: 'directional',
          color: { r: 1.0, g: 1.0, b: 1.0 },
          intensity: 1.0,
          enabled: true,
          castShadow: true,
          directionX: 0.0,
          directionY: -1.0,
          directionZ: 0.0,
          range: 10.0,
          decay: 1.0,
          angle: Math.PI / 6,
          penumbra: 0.1,
          shadowMapSize: 1024,
          shadowBias: -0.0001,
          shadowRadius: 1.0,
        };
        break;
      case KnownComponentTypes.SOUND:
        defaultData = {
          audioPath: '',
          enabled: true,
          autoplay: false,
          loop: false,
          volume: 1.0,
          pitch: 1.0,
          playbackRate: 1.0,
          muted: false,
          is3D: true,
          minDistance: 1,
          maxDistance: 10000,
          rolloffFactor: 1,
          coneInnerAngle: 360,
          coneOuterAngle: 360,
          coneOuterGain: 0,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        };
        break;
      case KnownComponentTypes.CHARACTER_CONTROLLER:
        defaultData = {
          enabled: true,
          slopeLimit: 45.0,
          stepOffset: 0.3,
          skinWidth: 0.08,
          gravityScale: 1.0,
          maxSpeed: 6.0,
          jumpStrength: 6.5,
          controlMode: 'auto',
          inputMapping: {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            jump: 'space',
          },
          isGrounded: false,
        };
        break;
    }

    componentManager.addComponent(entityId, componentType, defaultData);
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
          const definition = COMPONENT_DEFINITIONS.find((def) => def.id === component.type);
          return (
            <div
              key={component.type}
              className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 border border-gray-600/50 rounded text-xs"
              title={definition?.description || component.type}
            >
              {definition?.icon || <FiBox className="w-3 h-3" />}
              <span className="text-gray-300">{definition?.name || component.type}</span>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div
            className="flex items-center px-2 py-1 bg-gray-600/50 border border-gray-500/50 rounded text-xs text-gray-400 cursor-help"
            title={`+${hiddenCount} more: ${entityComponents
              .slice(maxVisible)
              .map((c) => {
                const def = COMPONENT_DEFINITIONS.find((d) => d.id === c.type);
                return def?.name || c.type;
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

        {/* Component Requirements Warning */}
        {entityComponents.some((c) => c.type === 'CharacterController') &&
          !entityComponents.some((c) => c.type === 'MeshCollider') && (
            <div className="px-4 py-2 bg-yellow-900/30 border-y border-yellow-700/50">
              <p className="text-xs text-yellow-400">
                <strong>Note:</strong> Character Controller requires a MeshCollider component for
                physics-based movement. Add a MeshCollider (preferably Capsule type) for proper
                collision detection.
              </p>
            </div>
          )}

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
                            {component.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white group-hover:text-gray-100">
                              {component.name}
                            </div>
                            <div className="text-xs text-gray-400 group-hover:text-gray-300">
                              {component.description}
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
                          {pack.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-gray-100">
                            {pack.name}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-gray-300 mb-1">
                            {pack.description}
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {pack.components.map((compId) => {
                              const def = COMPONENT_DEFINITIONS.find((d) => d.id === compId);
                              return (
                                <span
                                  key={compId}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/20 border border-gray-500/30 rounded text-xs text-gray-300"
                                >
                                  {def?.icon || <FiBox className="w-3 h-3" />}
                                  {def?.name || compId}
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
  const { getComponentData } = useEntityData();
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to get default material data
  const getDefaultMaterialData = (entityId: number) => {
    const materialData = getComponentData(entityId, 'material') as Record<string, unknown> | null;
    let color = '#3399ff'; // Default blue like old ECS system

    if (materialData?.color) {
      if (Array.isArray(materialData.color)) {
        // Convert RGB array to hex
        const [r, g, b] = materialData.color;
        color = `#${Math.round(r * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(g * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(b * 255)
          .toString(16)
          .padStart(2, '0')}`;
      } else if (typeof materialData.color === 'string') {
        color = materialData.color;
      }
    }

    return {
      color,
      metalness: 0.0,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0.0,
    };
  };

  // Get components for this entity using new ECS system with reactive updates
  const [entityComponents, setEntityComponents] = useState<
    Array<{ entityId: number; type: string; data: unknown }>
  >([]);

  // Update components when entity changes or components are modified
  const updateEntityComponents = useCallback(() => {
    if (!isValidEntityId(entityId)) {
      setEntityComponents([]);
      return;
    }
    const components = componentManager.getComponentsForEntity(entityId);
    setEntityComponents(components);
  }, [entityId, componentManager]);

  // Listen for component events to update reactively
  useEffect(() => {
    updateEntityComponents();
  }, [updateEntityComponents]);

  // Listen for component events using the global event system
  useEvent('component:added', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  useEvent('component:removed', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  useEvent('component:updated', (event) => {
    if (event.entityId === entityId) {
      updateEntityComponents();
    }
  });

  // Get available components and packs
  const availableComponents = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = entityComponents.map((c) => c.type);
    return COMPONENT_DEFINITIONS.filter((comp) => !existingTypes.includes(comp.id));
  }, [entityId, entityComponents]);

  const availablePacks = useMemo(() => {
    if (!isValidEntityId(entityId)) return [];
    const existingTypes = entityComponents.map((c) => c.type);
    return COMPONENT_PACKS.filter((pack) =>
      pack.components.some((compId) => !existingTypes.includes(compId)),
    );
  }, [entityId, entityComponents]);

  // Filter by search term - combine components and packs
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const components = availableComponents.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) || comp.description.toLowerCase().includes(term),
    );
    const packs = availablePacks.filter(
      (pack) =>
        pack.name.toLowerCase().includes(term) || pack.description.toLowerCase().includes(term),
    );

    return [...packs, ...components]; // Show packs first
  }, [availableComponents, availablePacks, searchTerm]);

  const handleAddComponent = (componentType: string) => {
    if (!isValidEntityId(entityId)) return;

    // Add component with default data based on type
    let defaultData = {};
    switch (componentType) {
      case KnownComponentTypes.TRANSFORM:
        defaultData = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
        break;
      case KnownComponentTypes.MESH_RENDERER: {
        defaultData = {
          meshId: 'cube',
          materialId: 'default',
          enabled: true,
          castShadows: true,
          receiveShadows: true,
          ...(() => {
            const mat = getDefaultMaterialData(entityId);
            return Object.keys(mat).length ? { material: mat } : {};
          })(),
        };
        break;
      }
      case KnownComponentTypes.RIGID_BODY:
        defaultData = {
          type: 'dynamic',
          mass: 1,
          enabled: true,
          bodyType: 'dynamic',
          gravityScale: 1,
          canSleep: true,
          material: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        };
        break;
      case KnownComponentTypes.MESH_COLLIDER:
        defaultData = {
          enabled: true,
          colliderType: 'box',
          isTrigger: false,
          center: [0, 0, 0],
          size: {
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5,
            capsuleRadius: 0.5,
            capsuleHeight: 2,
          },
          physicsMaterial: {
            friction: 0.7,
            restitution: 0.3,
            density: 1,
          },
        };
        break;
      case KnownComponentTypes.LIGHT:
        defaultData = {
          lightType: 'directional',
          color: { r: 1.0, g: 1.0, b: 1.0 },
          intensity: 1.0,
          enabled: true,
          castShadow: true,
          directionX: 0.0,
          directionY: -1.0,
          directionZ: 0.0,
          range: 10.0,
          decay: 1.0,
          angle: Math.PI / 6,
          penumbra: 0.1,
          shadowMapSize: 1024,
          shadowBias: -0.0001,
          shadowRadius: 1.0,
        };
        break;
      case KnownComponentTypes.SOUND:
        defaultData = {
          audioPath: '',
          enabled: true,
          autoplay: false,
          loop: false,
          volume: 1.0,
          pitch: 1.0,
          playbackRate: 1.0,
          muted: false,
          is3D: true,
          minDistance: 1,
          maxDistance: 10000,
          rolloffFactor: 1,
          coneInnerAngle: 360,
          coneOuterAngle: 360,
          coneOuterGain: 0,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        };
        break;
      case KnownComponentTypes.CHARACTER_CONTROLLER:
        defaultData = {
          enabled: true,
          slopeLimit: 45.0,
          stepOffset: 0.3,
          skinWidth: 0.08,
          gravityScale: 1.0,
          maxSpeed: 6.0,
          jumpStrength: 6.5,
          controlMode: 'auto',
          inputMapping: {
            forward: 'w',
            backward: 's',
            left: 'a',
            right: 'd',
            jump: 'space',
          },
          isGrounded: false,
        };
        break;
    }

    componentManager.addComponent(entityId, componentType, defaultData);
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

  const handleItemClick = (item: IComponentDefinition | IComponentPack) => {
    if ('components' in item) {
      // It's a pack
      handleAddPack(item);
    } else {
      // It's a component
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
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white group-hover:text-gray-100 truncate">
                      {item.name}
                      {isPack && <span className="text-purple-300 ml-1">(Pack)</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 group-hover:text-gray-300 truncate">
                      {item.description}
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

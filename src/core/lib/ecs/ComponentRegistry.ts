import React from 'react';
import { FiBox, FiCamera, FiEye, FiMove, FiShield, FiZap } from 'react-icons/fi';

import { KnownComponentTypes } from './IComponent';

// Rendering contributions that a component can provide
export interface IRenderingContributions {
  geometry?: React.ReactNode;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  meshType?: string; // For geometry selection
}

// Physics contributions that a component can provide
export interface IPhysicsContributions {
  colliders?: React.ReactNode[];
  rigidBodyProps?: {
    type?: string;
    mass?: number;
    friction?: number;
    restitution?: number;
    density?: number;
    gravityScale?: number;
    canSleep?: boolean;
  };
  enabled?: boolean;
}

// Component pack definition
export interface IComponentPack {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  components: string[];
  category: string;
}

// Main component definition with all metadata and behavior
export interface IComponentDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;

  // Default data when component is added
  getDefaultData: (
    entityId?: number,
    getComponentData?: (entityId: number, componentType: string) => any,
  ) => any;

  // How this component affects rendering
  getRenderingContributions?: (data: any) => IRenderingContributions;

  // How this component affects physics
  getPhysicsContributions?: (data: any) => IPhysicsContributions;

  // Whether this component can be removed
  removable?: boolean;
}

// Helper to get default material data
const getDefaultMaterialData = (
  entityId?: number,
  getComponentData?: (entityId: number, componentType: string) => any,
) => {
  if (entityId === undefined || !getComponentData) {
    return {
      color: '#3399ff',
      metalness: 0.0,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0.0,
    };
  }

  const materialData = getComponentData(entityId, 'material') as any;
  let color = '#3399ff'; // Default blue

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

// Centralized component definitions
export const COMPONENT_REGISTRY: Record<string, IComponentDefinition> = {
  [KnownComponentTypes.TRANSFORM]: {
    id: KnownComponentTypes.TRANSFORM,
    name: 'Transform',
    description: 'Position, rotation, and scale',
    icon: React.createElement(FiMove, { className: 'w-4 h-4' }),
    category: 'Core',
    removable: false,
    getDefaultData: () => ({
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }),
  },

  [KnownComponentTypes.MESH_RENDERER]: {
    id: KnownComponentTypes.MESH_RENDERER,
    name: 'Mesh Renderer',
    description: 'Renders 3D mesh geometry',
    icon: React.createElement(FiEye, { className: 'w-4 h-4' }),
    category: 'Rendering',
    removable: true,
    getDefaultData: (entityId, getComponentData) => ({
      meshId: 'cube',
      materialId: 'default',
      enabled: true,
      castShadows: true,
      receiveShadows: true,
      material: getDefaultMaterialData(entityId, getComponentData),
    }),
    getRenderingContributions: (data) => {
      // Convert meshId to meshType for geometry selection
      const meshIdToTypeMap: { [key: string]: string } = {
        cube: 'Cube',
        sphere: 'Sphere',
        cylinder: 'Cylinder',
        cone: 'Cone',
        torus: 'Torus',
        plane: 'Plane',
        capsule: 'Cube', // Fallback to cube for now
      };

      return {
        meshType: meshIdToTypeMap[data.meshId] || 'Cube',
        material: data.material,
        visible: data.enabled ?? true,
        castShadow: data.castShadows ?? true,
        receiveShadow: data.receiveShadows ?? true,
      };
    },
  },

  [KnownComponentTypes.RIGID_BODY]: {
    id: KnownComponentTypes.RIGID_BODY,
    name: 'Rigid Body',
    description: 'Physics simulation body',
    icon: React.createElement(FiZap, { className: 'w-4 h-4' }),
    category: 'Physics',
    removable: true,
    getDefaultData: () => ({
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
    }),
    getPhysicsContributions: (data) => {
      console.log('[Rigid Body Debug] Input data:', data);
      const result = {
        rigidBodyProps: {
          type: data.bodyType || data.type,
          mass: data.mass ?? 1,
          friction: data.material?.friction ?? 0.7,
          restitution: data.material?.restitution ?? 0.3,
          density: data.material?.density ?? 1,
          gravityScale: data.gravityScale ?? 1,
          canSleep: data.canSleep ?? true,
        },
        enabled: data.enabled ?? true,
      };
      console.log('[Rigid Body Debug] Output:', result);
      return result;
    },
  },

  [KnownComponentTypes.MESH_COLLIDER]: {
    id: KnownComponentTypes.MESH_COLLIDER,
    name: 'Mesh Collider',
    description: 'Physics collision detection',
    icon: React.createElement(FiShield, { className: 'w-4 h-4' }),
    category: 'Physics',
    removable: true,
    getDefaultData: () => ({
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
    }),
    getPhysicsContributions: (data) => {
      if (!data.enabled) {
        return { enabled: false };
      }

      return {
        rigidBodyProps: {
          // Only contribute material properties, not body type or mass
          friction: data.physicsMaterial?.friction ?? 0.7,
          restitution: data.physicsMaterial?.restitution ?? 0.3,
          density: data.physicsMaterial?.density ?? 1,
        },
        enabled: true,
      };
    },
  },

  [KnownComponentTypes.CAMERA]: {
    id: KnownComponentTypes.CAMERA,
    name: 'Camera',
    description: 'Camera for rendering perspectives',
    icon: React.createElement(FiCamera, { className: 'w-4 h-4' }),
    category: 'Rendering',
    removable: true,
    getDefaultData: () => ({
      preset: 'unity-default',
      fov: 60,
      near: 0.3,
      far: 1000,
      isMain: false,
      enableControls: true,
      target: [0, 0, 0],
      projectionType: 'perspective',
      clearDepth: true,
      renderPriority: 0,
    }),
    getRenderingContributions: (_data) => {
      return {
        meshType: 'Camera', // Special camera shape
        visible: true,
        castShadow: false,
        receiveShadow: false,
      };
    },
  },
};

// Component packs using the registry
export const COMPONENT_PACKS: IComponentPack[] = [
  {
    id: 'physics-basics',
    name: 'Physics Basics',
    description: 'Rigid body + mesh collider for basic physics',
    icon: React.createElement(FiZap, { className: 'w-4 h-4' }),
    components: [KnownComponentTypes.RIGID_BODY, KnownComponentTypes.MESH_COLLIDER],
    category: 'Physics',
  },
  {
    id: 'rendering-basics',
    name: 'Rendering Basics',
    description: 'Complete rendering setup',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: [KnownComponentTypes.MESH_RENDERER],
    category: 'Rendering',
  },
  {
    id: 'complete-entity',
    name: 'Complete Entity',
    description: 'Transform + rendering for a complete visible entity',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: [KnownComponentTypes.TRANSFORM, KnownComponentTypes.MESH_RENDERER],
    category: 'Core',
  },
  {
    id: 'physics-entity',
    name: 'Physics Entity',
    description: 'Complete physics-enabled entity with rendering',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: [
      KnownComponentTypes.TRANSFORM,
      KnownComponentTypes.MESH_RENDERER,
      KnownComponentTypes.RIGID_BODY,
      KnownComponentTypes.MESH_COLLIDER,
    ],
    category: 'Physics',
  },
];

// Helper functions for the registry
export const getComponentDefinition = (componentType: string): IComponentDefinition | undefined => {
  return COMPONENT_REGISTRY[componentType];
};

export const getAllComponentDefinitions = (): IComponentDefinition[] => {
  return Object.values(COMPONENT_REGISTRY);
};

export const getComponentsByCategory = (): Record<string, IComponentDefinition[]> => {
  const categories: Record<string, IComponentDefinition[]> = {};
  Object.values(COMPONENT_REGISTRY).forEach((def) => {
    if (!categories[def.category]) {
      categories[def.category] = [];
    }
    categories[def.category].push(def);
  });
  return categories;
};

export const isComponentRemovable = (componentType: string): boolean => {
  const definition = getComponentDefinition(componentType);
  return definition?.removable ?? true;
};

// Helper to get default data for a component
export const getComponentDefaultData = (
  componentType: string,
  entityId?: number,
  getComponentData?: (entityId: number, componentType: string) => any,
): any => {
  const definition = getComponentDefinition(componentType);
  if (!definition) {
    return {};
  }
  return definition.getDefaultData(entityId, getComponentData);
};

// Helper to combine rendering contributions from all components
export const combineRenderingContributions = (
  entityComponents: Array<{ type: string; data: any }>,
): IRenderingContributions => {
  const combined: IRenderingContributions = {
    visible: true,
    castShadow: true,
    receiveShadow: true,
    meshType: 'Cube',
    material: {
      color: '#3399ff',
      metalness: 0,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
    },
  };

  entityComponents.forEach(({ type, data }) => {
    const definition = getComponentDefinition(type);
    if (definition?.getRenderingContributions) {
      const contributions = definition.getRenderingContributions(data);
      Object.assign(combined, contributions);
      if (contributions.material) {
        Object.assign(combined.material!, contributions.material);
      }
    }
  });

  return combined;
};

// Helper to combine physics contributions from all components
export const combinePhysicsContributions = (
  entityComponents: Array<{ type: string; data: any }>,
): IPhysicsContributions => {
  const combined: IPhysicsContributions = {
    enabled: false,
    rigidBodyProps: {
      type: 'dynamic',
      mass: 1,
      friction: 0.7,
      restitution: 0.3,
      density: 1,
      gravityScale: 1,
      canSleep: true,
    },
    colliders: [],
  };

  console.log('[Physics Debug] Starting with default:', combined.rigidBodyProps);

  // Process components in two passes:
  // 1. First pass: collect all contributions
  // 2. Second pass: ensure RigidBody type takes precedence

  let rigidBodyType: string | undefined;

  entityComponents.forEach(({ type, data }) => {
    const definition = getComponentDefinition(type);
    if (definition?.getPhysicsContributions) {
      const contributions = definition.getPhysicsContributions(data);
      console.log(`[Physics Debug] Component ${type} contributes:`, contributions);

      if (contributions.enabled) {
        combined.enabled = true;
      }

      // Store RigidBody type separately to ensure it takes precedence
      if (type === KnownComponentTypes.RIGID_BODY && contributions.rigidBodyProps?.type) {
        rigidBodyType = contributions.rigidBodyProps.type;
      }

      if (contributions.rigidBodyProps) {
        console.log(`[Physics Debug] Before assign for ${type}:`, combined.rigidBodyProps);
        Object.assign(combined.rigidBodyProps!, contributions.rigidBodyProps);
        console.log(`[Physics Debug] After assign for ${type}:`, combined.rigidBodyProps);
      }
      if (contributions.colliders) {
        combined.colliders!.push(...contributions.colliders);
      }
    }
  });

  // Ensure RigidBody type always takes precedence
  if (rigidBodyType) {
    combined.rigidBodyProps!.type = rigidBodyType;
    console.log('[Physics Debug] Applied RigidBody type precedence:', rigidBodyType);
  }

  console.log('[Physics Debug] Final result:', combined.rigidBodyProps);
  return combined;
};

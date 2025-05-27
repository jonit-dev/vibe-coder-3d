import { ComponentManifest, IRenderingContributions, IPhysicsContributions, IComponentPack, ComponentCategory } from '@core/components/types';

interface DiscoveredComponentModule {
  default: ComponentManifest<any>;
}

// Note: Vite specific import. Ensure environment supports import.meta.glob
const modules = import.meta.glob<DiscoveredComponentModule>('/src/core/components/definitions/*.ts', { eager: true });

const discoveredComponents: Record<string, ComponentManifest<any>> = {};
const componentManifestsList: ComponentManifest<any>[] = [];

for (const path in modules) {
  const manifestModule = modules[path];
  if (manifestModule && manifestModule.default && manifestModule.default.id) {
    const manifest = manifestModule.default;
    if (discoveredComponents[manifest.id]) {
      console.warn(`Duplicate component ID found: ${manifest.id} from path ${path}. Check your component definitions.`);
    }
    discoveredComponents[manifest.id] = manifest;
    componentManifestsList.push(manifest);
  } else {
    console.warn(`Component manifest from path ${path} is missing a default export or an 'id' property.`);
  }
}

export const AUTO_COMPONENT_REGISTRY: Readonly<Record<string, ComponentManifest<any>>> = Object.freeze(discoveredComponents);

const knownTypes: Record<string, string> = {};
componentManifestsList.forEach(m => {
  const enumKey = m.id.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  knownTypes[enumKey] = m.id;
});
export const AutoKnownComponentTypes = Object.freeze(knownTypes) as Record<string, string>;

// Assuming IComponentPack is imported from './types' or defined appropriately
// If not, a minimal local definition might be needed:
// interface IComponentPack { id: string; name: string; description: string; icon: React.ReactNode; components: string[]; category: string; }
import React from 'react'; // Required for JSX in icons
import { FiZap, FiBox, FiCamera, FiShield, FiMove, FiEye } from 'react-icons/fi'; // Import necessary icons

export const AUTO_COMPONENT_PACKS: Readonly<IComponentPack[]> = Object.freeze([
  {
    id: 'physics-basics',
    name: 'Physics Basics',
    description: 'Rigid body + mesh collider for basic physics',
    icon: React.createElement(FiZap, { className: 'w-4 h-4' }),
    components: ['RigidBody', 'MeshCollider'], // Using string IDs
    category: ComponentCategory.Physics,
  },
  {
    id: 'rendering-basics',
    name: 'Rendering Basics',
    description: 'Complete rendering setup',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: ['MeshRenderer'], // Using string ID
    category: ComponentCategory.Rendering,
  },
  {
    id: 'complete-entity',
    name: 'Complete Entity',
    description: 'Transform + rendering for a complete visible entity',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: ['Transform', 'MeshRenderer'], // Using string IDs
    category: ComponentCategory.Core,
  },
  {
    id: 'physics-entity',
    name: 'Physics Entity',
    description: 'Complete physics-enabled entity with rendering',
    icon: React.createElement(FiBox, { className: 'w-4 h-4' }),
    components: ['Transform', 'MeshRenderer', 'RigidBody', 'MeshCollider'], // Using string IDs
    category: ComponentCategory.Physics,
  },
  // Add other packs if they were present in the original COMPONENT_PACKS
  // For example, if there was a camera pack:
  // {
  //   id: 'camera-pack',
  //   name: 'Camera Setup',
  //   description: 'Basic camera',
  //   icon: React.createElement(FiCamera, { className: 'w-4 h-4' }),
  //   components: ['Camera'], // Assuming a 'Camera' component manifest will exist
  //   category: 'Rendering',
  // },
]);

export const getComponentDefinition = (componentId: string): ComponentManifest<any> | undefined => {
  return AUTO_COMPONENT_REGISTRY[componentId];
};

export const getAllComponentDefinitions = (): ComponentManifest<any>[] => {
  return Object.values(AUTO_COMPONENT_REGISTRY);
};

// IRenderingContributions and IPhysicsContributions are now imported at the top.

export const getComponentsByCategory = (): Record<string, ComponentManifest<any>[]> => {
  const categories: Record<string, ComponentManifest<any>[]> = {};
  Object.values(AUTO_COMPONENT_REGISTRY).forEach((manifest) => {
    if (!categories[manifest.category]) {
      categories[manifest.category] = [];
    }
    categories[manifest.category].push(manifest);
  });
  return categories;
};

export const isComponentRemovable = (componentId: string): boolean => {
  const manifest = getComponentDefinition(componentId);
  return manifest?.removable ?? true; // Default to true if manifest or removable is not defined
};

export const getComponentDefaultData = (componentId: string): any => {
  const manifest = getComponentDefinition(componentId);
  if (!manifest) {
    console.warn(`[getComponentDefaultData] Manifest not found for component ID: ${componentId}`);
    return {};
  }
  return manifest.getDefaultData();
};

// Helper to combine rendering contributions from all components on an entity
export const combineRenderingContributions = (
  entityComponents: Array<{ type: string; data: any }>,
): IRenderingContributions => {
  const combined: IRenderingContributions = {
    visible: true,
    castShadow: true,
    receiveShadow: true,
    // meshType: 'Cube', // Default meshType is not needed here, should come from a component
    material: {
      color: '#3399ff', // Default color if no component specifies one
      metalness: 0,
      roughness: 0.5,
      emissive: '#000000',
      emissiveIntensity: 0,
    },
  };

  entityComponents.forEach(({ type, data }) => {
    const manifest = getComponentDefinition(type);
    if (manifest?.getRenderingContributions) {
      const contributions = manifest.getRenderingContributions(data);
      // Merge contributions, with component-specific values overriding defaults or previous ones
      if (contributions.geometry !== undefined) combined.geometry = contributions.geometry;
      if (contributions.material) {
        combined.material = { ...combined.material, ...contributions.material };
      }
      if (contributions.visible !== undefined) combined.visible = contributions.visible;
      if (contributions.castShadow !== undefined) combined.castShadow = contributions.castShadow;
      if (contributions.receiveShadow !== undefined) combined.receiveShadow = contributions.receiveShadow;
      if (contributions.meshType !== undefined) combined.meshType = contributions.meshType;
    }
  });

  return combined;
};

// Helper to combine physics contributions from all components on an entity
export const combinePhysicsContributions = (
  entityComponents: Array<{ type: string; data: any }>,
): IPhysicsContributions => {
  const combined: IPhysicsContributions = {
    enabled: false, // Physics is disabled by default unless a component enables it
    rigidBodyProps: { // Default rigid body props
      // type: 'dynamic', // Type should come from a component (e.g. RigidBody)
      mass: 1,
      friction: 0.7,
      restitution: 0.3,
      density: 1,
      gravityScale: 1,
      canSleep: true,
    },
    colliders: [],
  };

  let primaryRigidBodyType: string | undefined;

  entityComponents.forEach(({ type, data }) => {
    const manifest = getComponentDefinition(type);
    if (manifest?.getPhysicsContributions) {
      const contributions = manifest.getPhysicsContributions(data);

      if (contributions.enabled !== undefined) {
        // If any component enables physics, the combined physics should be enabled.
        // If a component explicitly disables it, it could be tricky.
        // Current logic: if ANY component says enabled:true, then it's enabled.
        if(contributions.enabled) combined.enabled = true;
      }

      if (contributions.rigidBodyProps) {
        // Store the type from the primary physics component (e.g. RigidBody)
        // This assumes 'RigidBody' or similar component is responsible for defining the body type.
        // For now, let's assume the component with id 'RigidBody' dictates the type.
        if (type === 'RigidBody' && contributions.rigidBodyProps.type) {
            primaryRigidBodyType = contributions.rigidBodyProps.type;
        }
        // Merge other props.
        combined.rigidBodyProps = { ...combined.rigidBodyProps, ...contributions.rigidBodyProps };
      }

      if (contributions.colliders) {
        combined.colliders = [...(combined.colliders || []), ...contributions.colliders];
      }
    }
  });

  // Apply the primary rigid body type if it was found
  if (primaryRigidBodyType && combined.rigidBodyProps) {
    combined.rigidBodyProps.type = primaryRigidBodyType;
  } else if (!combined.rigidBodyProps?.type && combined.enabled) {
    // If physics is enabled but no component specified a type (e.g. RigidBody), default to dynamic
    // This might or might not be desired. For now, we ensure 'type' is set if enabled.
    // combined.rigidBodyProps.type = 'dynamic';
    // Re-evaluating this: if no component defines a body type, it shouldn't default here.
    // The PhysicsSystem should handle entities that have physics contributions but no explicit RigidBody type.
  }


  return combined;
};

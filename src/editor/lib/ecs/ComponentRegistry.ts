import { z } from 'zod';

import { ComponentCategory, IComponentDescriptor } from '@/core/types/component-registry';

import { KnownComponentTypes } from './IComponent';
import { IMeshColliderData } from './components/MeshColliderComponent';
import { IMeshRendererData } from './components/MeshRendererComponent';
import { IRigidBodyData } from './components/RigidBodyComponent';
import { ITransformData } from './components/TransformComponent';

// Component registry with removable properties
export const COMPONENT_REGISTRY: Record<string, IComponentDescriptor> = {
  [KnownComponentTypes.TRANSFORM]: {
    id: KnownComponentTypes.TRANSFORM,
    name: 'Transform',
    category: ComponentCategory.Core,
    component: null, // Will be set when bitecs components are available
    required: true,
    removable: false, // Transform is required and cannot be removed
    schema: z.object({
      position: z.tuple([z.number(), z.number(), z.number()]),
      rotation: z.tuple([z.number(), z.number(), z.number()]),
      scale: z.tuple([z.number(), z.number(), z.number()]),
    }),
    serialize: (_entityId: number) => {
      // Implementation will be added when needed
      return undefined;
    },
    deserialize: (_entityId: number, _data: ITransformData) => {
      // Implementation will be added when needed
    },
    metadata: {
      description: 'Position, rotation, and scale of the entity',
      tags: ['core', 'transform', 'required'],
    },
  },

  [KnownComponentTypes.MESH_RENDERER]: {
    id: KnownComponentTypes.MESH_RENDERER,
    name: 'Mesh Renderer',
    category: ComponentCategory.Rendering,
    component: null,
    required: false,
    removable: true, // Can be removed
    schema: z.object({
      meshId: z.string(),
      materialId: z.string(),
      enabled: z.boolean(),
      material: z.object({
        color: z.string(),
        metalness: z.number(),
        roughness: z.number(),
        emissive: z.string(),
        emissiveIntensity: z.number(),
      }),
    }),
    serialize: (_entityId: number) => {
      return undefined;
    },
    deserialize: (_entityId: number, _data: IMeshRendererData) => {
      // Implementation will be added when needed
    },
    metadata: {
      description: 'Renders 3D mesh geometry',
      tags: ['rendering', 'visual'],
    },
  },

  [KnownComponentTypes.RIGID_BODY]: {
    id: KnownComponentTypes.RIGID_BODY,
    name: 'Rigid Body',
    category: ComponentCategory.Physics,
    component: null,
    required: false,
    removable: true, // Can be removed
    schema: z.object({
      enabled: z.boolean(),
      bodyType: z.string(),
      mass: z.number(),
      gravityScale: z.number(),
      canSleep: z.boolean(),
      linearDamping: z.number().optional(),
      angularDamping: z.number().optional(),
      initialVelocity: z.tuple([z.number(), z.number(), z.number()]).optional(),
      initialAngularVelocity: z.tuple([z.number(), z.number(), z.number()]).optional(),
      material: z.object({
        friction: z.number(),
        restitution: z.number(),
        density: z.number(),
      }),
    }),
    serialize: (_entityId: number) => {
      return undefined;
    },
    deserialize: (_entityId: number, _data: IRigidBodyData) => {
      // Implementation will be added when needed
    },
    metadata: {
      description: 'Physics simulation body',
      tags: ['physics', 'simulation'],
    },
  },

  [KnownComponentTypes.MESH_COLLIDER]: {
    id: KnownComponentTypes.MESH_COLLIDER,
    name: 'Mesh Collider',
    category: ComponentCategory.Physics,
    component: null,
    required: false,
    removable: true, // Can be removed
    schema: z.object({
      enabled: z.boolean(),
      colliderType: z.enum(['box', 'sphere', 'capsule', 'convex', 'mesh']),
      isTrigger: z.boolean(),
      center: z.tuple([z.number(), z.number(), z.number()]),
      size: z.object({
        width: z.number(),
        height: z.number(),
        depth: z.number(),
        radius: z.number(),
        capsuleRadius: z.number(),
        capsuleHeight: z.number(),
      }),
      physicsMaterial: z.object({
        friction: z.number(),
        restitution: z.number(),
        density: z.number(),
      }),
    }),
    serialize: (_entityId: number) => {
      return undefined;
    },
    deserialize: (_entityId: number, _data: IMeshColliderData) => {
      // Implementation will be added when needed
    },
    metadata: {
      description: 'Physics collision detection',
      tags: ['physics', 'collision'],
    },
  },
};

/**
 * Get component descriptor by ID
 */
export function getComponentDescriptor(componentId: string): IComponentDescriptor | undefined {
  return COMPONENT_REGISTRY[componentId];
}

/**
 * Check if a component is removable
 */
export function isComponentRemovable(componentId: string): boolean {
  const descriptor = getComponentDescriptor(componentId);
  return descriptor?.removable ?? true; // Default to removable if not specified
}

/**
 * Check if a component is required
 */
export function isComponentRequired(componentId: string): boolean {
  const descriptor = getComponentDescriptor(componentId);
  return descriptor?.required ?? false; // Default to not required if not specified
}

/**
 * Get all registered component IDs
 */
export function getRegisteredComponentIds(): string[] {
  return Object.keys(COMPONENT_REGISTRY);
}

/**
 * Get components by category
 */
export function getComponentsByCategory(category: ComponentCategory): IComponentDescriptor[] {
  return Object.values(COMPONENT_REGISTRY).filter((desc) => desc.category === category);
}

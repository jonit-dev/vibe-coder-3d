import { z } from 'zod';

import {
  getEntityName,
  Material,
  MeshType,
  Name,
  setEntityName,
  Transform,
  Velocity,
} from '@/core/lib/ecs';
import { ComponentCategory, IComponentDescriptor } from '@/core/types/component-registry';
import {
  MaterialComponentSchema,
  MeshTypeEnumSchema,
  TransformComponentSchema,
  VelocityComponentSchema,
} from '@/core/types/ecs';

// Core Components - These are required for entity functionality and cannot be removed
export const transformDescriptor: IComponentDescriptor = {
  id: 'transform',
  name: 'Transform',
  category: ComponentCategory.Core,
  component: Transform,
  required: true,
  removable: false, // Core component - cannot be removed
  schema: TransformComponentSchema,
  serialize: (entityId: number) => ({
    position: [
      Transform.position[entityId][0],
      Transform.position[entityId][1],
      Transform.position[entityId][2],
    ] as [number, number, number],
    rotation: [
      Transform.rotation[entityId][0],
      Transform.rotation[entityId][1],
      Transform.rotation[entityId][2],
    ] as [number, number, number],
    scale: [
      Transform.scale[entityId][0],
      Transform.scale[entityId][1],
      Transform.scale[entityId][2],
    ] as [number, number, number],
    needsUpdate: Transform.needsUpdate[entityId],
  }),
  deserialize: (entityId: number, data: any) => {
    Transform.position[entityId][0] = data.position[0];
    Transform.position[entityId][1] = data.position[1];
    Transform.position[entityId][2] = data.position[2];
    Transform.rotation[entityId][0] = data.rotation[0];
    Transform.rotation[entityId][1] = data.rotation[1];
    Transform.rotation[entityId][2] = data.rotation[2];
    Transform.scale[entityId][0] = data.scale[0];
    Transform.scale[entityId][1] = data.scale[1];
    Transform.scale[entityId][2] = data.scale[2];
    Transform.needsUpdate[entityId] = data.needsUpdate ?? 1;
  },
  metadata: {
    description: 'Position, rotation, and scale of the entity',
    version: '1.0.0',
  },
};

export const nameDescriptor: IComponentDescriptor = {
  id: 'name',
  name: 'Name',
  category: ComponentCategory.Core,
  component: Name,
  removable: false, // Core component - entities should always have a name
  schema: z.object({
    value: z.string().max(32).default('Entity'),
  }),
  serialize: (entityId: number) => ({
    value: getEntityName(entityId),
  }),
  deserialize: (entityId: number, data: any) => {
    setEntityName(entityId, data.value);
  },
  metadata: {
    description: 'Human-readable name for the entity',
    version: '1.0.0',
  },
};

// Rendering Components - Essential for visual entities, but some might be removable depending on use case
export const meshTypeDescriptor: IComponentDescriptor = {
  id: 'meshType',
  name: 'Mesh Type',
  category: ComponentCategory.Rendering,
  component: MeshType,
  required: true,
  removable: false, // Core rendering component - entities need geometry
  dependencies: ['transform'],
  schema: z.object({
    type: MeshTypeEnumSchema.default(0), // Default to Cube
  }),
  serialize: (entityId: number) => ({
    type: MeshType.type[entityId],
  }),
  deserialize: (entityId: number, data: any) => {
    MeshType.type[entityId] = data.type;
  },
  metadata: {
    description: 'The geometric shape type of the entity mesh',
    version: '1.0.0',
  },
};

export const materialDescriptor: IComponentDescriptor = {
  id: 'material',
  name: 'Material',
  category: ComponentCategory.Rendering,
  component: Material,
  required: true,
  removable: false, // Core rendering component - entities need materials
  dependencies: ['meshType'],
  schema: MaterialComponentSchema,
  serialize: (entityId: number) => ({
    color: [
      Material.color[entityId][0],
      Material.color[entityId][1],
      Material.color[entityId][2],
    ] as [number, number, number],
    needsUpdate: Material.needsUpdate[entityId],
  }),
  deserialize: (entityId: number, data: any) => {
    Material.color[entityId][0] = data.color[0];
    Material.color[entityId][1] = data.color[1];
    Material.color[entityId][2] = data.color[2];
    Material.needsUpdate[entityId] = data.needsUpdate ?? 1;
  },
  metadata: {
    description: 'Visual appearance properties of the entity',
    version: '1.0.0',
  },
};

// Physics Components - Optional, can be added/removed as needed
export const velocityDescriptor: IComponentDescriptor = {
  id: 'velocity',
  name: 'Velocity',
  category: ComponentCategory.Physics,
  component: Velocity,
  removable: true, // Optional physics component
  dependencies: ['transform'],
  schema: VelocityComponentSchema,
  serialize: (entityId: number) => ({
    linear: [
      Velocity.linear[entityId][0],
      Velocity.linear[entityId][1],
      Velocity.linear[entityId][2],
    ] as [number, number, number],
    angular: [
      Velocity.angular[entityId][0],
      Velocity.angular[entityId][1],
      Velocity.angular[entityId][2],
    ] as [number, number, number],
    linearDamping: Velocity.linearDamping[entityId],
    angularDamping: Velocity.angularDamping[entityId],
    priority: Velocity.priority[entityId],
  }),
  deserialize: (entityId: number, data: any) => {
    Velocity.linear[entityId][0] = data.linear[0];
    Velocity.linear[entityId][1] = data.linear[1];
    Velocity.linear[entityId][2] = data.linear[2];
    Velocity.angular[entityId][0] = data.angular[0];
    Velocity.angular[entityId][1] = data.angular[1];
    Velocity.angular[entityId][2] = data.angular[2];
    Velocity.linearDamping[entityId] = data.linearDamping;
    Velocity.angularDamping[entityId] = data.angularDamping;
    Velocity.priority[entityId] = data.priority;
  },
  metadata: {
    description: 'Linear and angular velocity for entity movement',
    version: '1.0.0',
  },
};

// Editor Store Components (these don't use bitECS components) - All optional and removable
export const rigidBodyDescriptor: IComponentDescriptor = {
  id: 'rigidBody',
  name: 'Rigid Body',
  category: ComponentCategory.Physics,
  component: null, // This is managed by the editor store, not bitECS
  removable: true, // Optional physics component
  dependencies: ['transform'],
  conflicts: [],
  schema: z.object({
    enabled: z.boolean().default(true),
    bodyType: z.enum(['dynamic', 'kinematic', 'static']).default('dynamic'),
    mass: z.number().min(0).default(1),
    gravityScale: z.number().default(1),
    canSleep: z.boolean().default(true),
    linearDamping: z.number().min(0).default(0.01),
    angularDamping: z.number().min(0).default(0.01),
    material: z.object({
      friction: z.number().min(0).max(1).default(0.6),
      restitution: z.number().min(0).max(1).default(0.3),
      density: z.number().min(0).default(1),
    }),
  }),
  serialize: (_entityId: number) => {
    // This would integrate with the editor store
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // This is handled by the EditorStoreIntegration
  },
  metadata: {
    description: 'Physics rigid body for realistic physics simulation',
    version: '1.0.0',
  },
};

export const meshColliderDescriptor: IComponentDescriptor = {
  id: 'meshCollider',
  name: 'Mesh Collider',
  category: ComponentCategory.Physics,
  component: null, // This is managed by the editor store, not bitECS
  removable: true, // Optional physics component
  dependencies: ['transform'],
  schema: z.object({
    enabled: z.boolean().default(true),
    colliderType: z.enum(['box', 'sphere', 'capsule', 'mesh']).default('box'),
    isTrigger: z.boolean().default(false),
    center: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    size: z.object({
      width: z.number().min(0).default(1),
      height: z.number().min(0).default(1),
      depth: z.number().min(0).default(1),
      radius: z.number().min(0).default(0.5),
      capsuleRadius: z.number().min(0).default(0.5),
      capsuleHeight: z.number().min(0).default(2),
    }),
    physicsMaterial: z.object({
      friction: z.number().min(0).max(1).default(0.6),
      restitution: z.number().min(0).max(1).default(0.3),
      density: z.number().min(0).default(1),
    }),
  }),
  serialize: (_entityId: number) => {
    // This would integrate with the editor store
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // This is handled by the EditorStoreIntegration
  },
  metadata: {
    description: 'Collision detection shape for the entity',
    version: '1.0.0',
  },
};

export const meshRendererDescriptor: IComponentDescriptor = {
  id: 'meshRenderer',
  name: 'Mesh Renderer',
  category: ComponentCategory.Rendering,
  component: null, // This is managed by the editor store, not bitECS
  removable: true, // Optional rendering enhancement
  dependencies: ['transform', 'meshType', 'material'],
  schema: z.object({
    enabled: z.boolean().default(true),
    castShadows: z.boolean().default(true),
    receiveShadows: z.boolean().default(true),
    material: z.object({
      color: z.string().default('#ffffff'),
      metalness: z.number().min(0).max(1).default(0),
      roughness: z.number().min(0).max(1).default(0.5),
      emissive: z.string().default('#000000'),
      emissiveIntensity: z.number().min(0).default(0),
    }),
  }),
  serialize: (_entityId: number) => {
    // This would integrate with the editor store
    return null;
  },
  deserialize: (_entityId: number, _data: any) => {
    // This would integrate with the editor store
  },
  metadata: {
    description: 'Enhanced rendering properties and materials for the entity mesh',
    version: '1.0.0',
  },
};

/**
 * Register all built-in components with the registry
 *
 * Component Removability Rules:
 * - Core components (transform, name, meshType, material): NOT removable - required for basic entity functionality
 * - Physics components (velocity, rigidBody, meshCollider): Removable - optional simulation features
 * - Enhanced rendering (meshRenderer): Removable - optional visual enhancements
 */
export function registerBuiltInComponents(registry: any): void {
  try {
    registry.registerComponent(transformDescriptor);
    registry.registerComponent(meshTypeDescriptor);
    registry.registerComponent(materialDescriptor);
    registry.registerComponent(nameDescriptor);
    registry.registerComponent(velocityDescriptor);
    registry.registerComponent(rigidBodyDescriptor);
    registry.registerComponent(meshColliderDescriptor);
    registry.registerComponent(meshRendererDescriptor);

    console.log('✅ All built-in components registered successfully');
  } catch (error) {
    console.error('❌ Failed to register built-in components:', error);
    throw error;
  }
}

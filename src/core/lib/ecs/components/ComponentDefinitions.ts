/**
 * Component Definitions using the new scalable registry system
 * This file now imports from individual component definition files for better scalability
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory, componentRegistry } from '../ComponentRegistry';

// Import all core component definitions from individual files
import {
  cameraComponent,
  customShapeComponent,
  geometryAssetComponent,
  instancedComponent,
  lightComponent,
  meshColliderComponent,
  meshRendererComponent,
  persistentIdComponent,
  PrefabInstanceComponent,
  rigidBodyComponent,
  scriptComponent,
  soundComponent,
  terrainComponent,
  transformComponent,
  type CameraData,
  type CustomShapeData,
  type InstancedComponentData,
  type LightData,
  type MeshColliderData,
  type MeshRendererData,
  type PersistentIdData,
  type RigidBodyData,
  type SoundData,
  type TransformData,
} from './definitions';

// ============================================================================
// REGISTER ALL CORE COMPONENTS
// ============================================================================

export function registerCoreComponents(registry = componentRegistry): void {
  registry.register(persistentIdComponent.get());
  registry.register(transformComponent);
  registry.register(meshRendererComponent);
  registry.register(geometryAssetComponent);
  registry.register(instancedComponent);
  registry.register(customShapeComponent);
  registry.register(terrainComponent);
  registry.register(rigidBodyComponent);
  registry.register(meshColliderComponent);
  registry.register(cameraComponent);
  registry.register(lightComponent);
  registry.register(scriptComponent);
  registry.register(soundComponent);
  registry.register(PrefabInstanceComponent);
}

// ============================================================================
// EXAMPLE: Adding new components is now super simple!
// ============================================================================

// Health Component (example of how easy it is to add new components)
const HealthSchema = z.object({
  current: z.number(),
  maximum: z.number(),
  regenerationRate: z.number(),
  isInvulnerable: z.boolean(),
});

const healthComponent = ComponentFactory.createSimple({
  id: 'Health',
  name: 'Health',
  category: ComponentCategory.Gameplay,
  schema: HealthSchema,
  fieldMappings: {
    current: Types.f32,
    maximum: Types.f32,
    regenerationRate: Types.f32,
    isInvulnerable: Types.ui8,
  },
  onAdd: () => {
    // Empty
  },
  metadata: {
    description: 'Health and damage system for gameplay entities',
    version: '1.0.0',
  },
});

// Velocity Component (example of a simple physics component)
const VelocitySchema = z.object({
  linearX: z.number(),
  linearY: z.number(),
  linearZ: z.number(),
  angularX: z.number(),
  angularY: z.number(),
  angularZ: z.number(),
  damping: z.number(),
});

const velocityComponent = ComponentFactory.createSimple({
  id: 'Velocity',
  name: 'Velocity',
  category: ComponentCategory.Physics,
  schema: VelocitySchema,
  fieldMappings: {
    linearX: Types.f32,
    linearY: Types.f32,
    linearZ: Types.f32,
    angularX: Types.f32,
    angularY: Types.f32,
    angularZ: Types.f32,
    damping: Types.f32,
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Linear and angular velocity for movement',
    version: '1.0.0',
  },
});

// Register example components
export function registerExampleComponents(): void {
  componentRegistry.register(healthComponent);
  componentRegistry.register(velocityComponent);
}

// Export type definitions for TypeScript support
export type {
  CameraData,
  CustomShapeData,
  InstancedComponentData,
  LightData,
  MeshColliderData,
  MeshRendererData,
  PersistentIdData,
  RigidBodyData,
  SoundData,
  TransformData,
};

export type HealthData = z.infer<typeof HealthSchema>;
export type VelocityData = z.infer<typeof VelocitySchema>;

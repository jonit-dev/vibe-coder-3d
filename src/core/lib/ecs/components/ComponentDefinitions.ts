/**
 * Component Definitions using the new scalable registry system
 * This file now imports from individual component definition files for better scalability
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory, componentRegistry } from '../ComponentRegistry';
import { EntityId } from '../types';

// Import all core component definitions from individual files
import {
  cameraComponent,
  lightComponent,
  meshColliderComponent,
  meshRendererComponent,
  rigidBodyComponent,
  transformComponent,
  type CameraData,
  type LightData,
  type MeshColliderData,
  type MeshRendererData,
  type RigidBodyData,
  type TransformData,
} from './definitions';

// ============================================================================
// REGISTER ALL CORE COMPONENTS
// ============================================================================

export function registerCoreComponents(): void {
  componentRegistry.register(transformComponent);
  componentRegistry.register(meshRendererComponent);
  componentRegistry.register(rigidBodyComponent);
  componentRegistry.register(meshColliderComponent);
  componentRegistry.register(cameraComponent);
  componentRegistry.register(lightComponent);

  console.log('Core components registered successfully');
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
  onAdd: (eid: EntityId, data) => {
    console.log(`Health component added to entity ${eid} with ${data.current}/${data.maximum} HP`);
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

  console.log('Example components registered successfully');
}

// Export type definitions for TypeScript support
export type {
  CameraData,
  LightData,
  MeshColliderData,
  MeshRendererData,
  RigidBodyData,
  TransformData,
};

export type HealthData = z.infer<typeof HealthSchema>;
export type VelocityData = z.infer<typeof VelocitySchema>;

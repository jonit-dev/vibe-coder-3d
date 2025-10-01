/**
 * Component Definitions using the new scalable registry system
 * This file now imports from individual component definition files for better scalability
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory, componentRegistry } from '../ComponentRegistry';
import { EntityId } from '../types';
import { Logger } from '@core/lib/logger';

// Import all core component definitions from individual files
import {
  cameraComponent,
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

// Create logger for component registration timing
const componentLogger = Logger.create('ECS:Components');

export function registerCoreComponents(): void {
  const stepTracker = componentLogger.createStepTracker('Core Components Registration');

  stepTracker.step('PersistentId Component');
  componentRegistry.register(persistentIdComponent.get());

  stepTracker.step('Transform Component');
  componentRegistry.register(transformComponent);

  stepTracker.step('MeshRenderer Component');
  componentRegistry.register(meshRendererComponent);

  stepTracker.step('Terrain Component');
  componentRegistry.register(terrainComponent);

  stepTracker.step('RigidBody Component');
  componentRegistry.register(rigidBodyComponent);

  stepTracker.step('MeshCollider Component');
  componentRegistry.register(meshColliderComponent);

  stepTracker.step('Camera Component');
  componentRegistry.register(cameraComponent);

  stepTracker.step('Light Component');
  componentRegistry.register(lightComponent);

  stepTracker.step('Script Component');
  componentRegistry.register(scriptComponent);

  stepTracker.step('Sound Component');
  componentRegistry.register(soundComponent);

  stepTracker.step('PrefabInstance Component');
  componentRegistry.register(PrefabInstanceComponent);

  stepTracker.complete();
  componentLogger.milestone('Core Components Registered', { componentsCount: 11 });
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
  const stepTracker = componentLogger.createStepTracker('Example Components Registration');

  stepTracker.step('Health Component');
  componentRegistry.register(healthComponent);

  stepTracker.step('Velocity Component');
  componentRegistry.register(velocityComponent);

  stepTracker.complete();
  componentLogger.milestone('Example Components Registered', { componentsCount: 2 });
}

// Export type definitions for TypeScript support
export type {
  CameraData,
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

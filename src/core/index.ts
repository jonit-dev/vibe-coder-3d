// Core Engine Exports
// This file exports all the core components, hooks, and utilities from the engine

// Components
export {
  EntityMesh,
  EntityMeshPropsSchema,
  EntityMesh as OptimizedEntityMesh,
  validateEntityMeshProps,
} from '@/core/components/EntityMesh';
export type {
  IEntityMeshProps as EntityMeshProps,
  IEntityMeshProps as OptimizedEntityMeshProps,
} from '@/core/components/EntityMesh';
export { EngineLoop } from './components/EngineLoop';
export { Entity, EntityPropsSchema, validateEntityProps } from './components/Entity';
export type { IEntityProps as EntityProps } from './components/Entity';
export {
  GameEngine,
  GameEnginePropsSchema,
  validateGameEngineProps,
} from './components/GameEngine';
export type { IGameEngineProps as GameEngineProps } from './components/GameEngine';

// Physics Components
export { PhysicsBox } from './components/physics/PhysicsBox';
export { PhysicsJoint } from './components/physics/PhysicsJoint';
export { PhysicsObject } from './components/physics/PhysicsObject';
export { PhysicsSphere } from './components/physics/PhysicsSphere';
export { PhysicsSystem } from './components/physics/PhysicsSystem';
export { PhysicsTrigger } from './components/physics/PhysicsTrigger';
export { PhysicsWorld } from './components/physics/PhysicsWorld';

// Debug Components

// Hooks
export { useEntity, useEntityQuery } from './hooks/useEntity';
export { useGameEngine } from './hooks/useGameEngine';
export type { IGameEngineControls as GameEngineControls } from './hooks/useGameEngine';

// State
export { useGameLoop } from './lib/gameLoop';
export { useEngineStore } from './state/engineStore';

// ECS
export {
  Transform,
  Velocity,
  addVelocity,
  createEntity,
  destroyEntity,
  entityToObject,
  markAllTransformsForUpdate,
  objectToEntity,
  resetWorld,
  transformQuery,
  velocityQuery,
  world,
} from './lib/ecs';

// ECS Manager
export { ecsManager } from './lib/ecs-manager';
export type { IVelocityOptions } from './lib/ecs-manager';

// Rendering Utilities
export {
  computeCullingVolume,
  createLODManager,
  isCulled,
  optimizeMaterials,
  prepareForInstancing,
  textureUtils,
} from './lib/rendering';

// Systems
export {
  PhysicsBodyRef,
  registerPhysicsBody,
  setPhysicsBodyActive,
  unregisterPhysicsBody,
} from './systems/PhysicsSyncSystem';
export { transformSystem } from './systems/transformSystem';
export { runVelocitySystem } from './systems/VelocitySystem';

// New Sprint 4 core abstractions
export { CharacterController } from '@/core/components/CharacterController';
export { Hud } from '@/core/components/ui';
export { useAudio } from '@/core/hooks/useAudio';
export { useEvent } from '@/core/hooks/useEvent';

// Assets and Types with Zod validation
export * from './types/assets';
export * from './types/ecs';

// Validation utilities (excluding conflicting exports)
export {
  AudioControlsSchema,
  AudioOptionsSchema,
  DebugVisualizationSchema,
  EventDataSchema,
  GameEngineControlsSchema,
  GameEventSchema,
  LODConfigSchema,
  PhysicsBodyConfigSchema,
  PositionSchema,
  QuaternionValidationSchema,
  RenderingConfigSchema,
  RotationSchema,
  ScaleSchema,
  SystemUpdateConfigSchema,
  createValidationError,
  getDefaultPosition,
  getDefaultQuaternion,
  getDefaultRotation,
  getDefaultScale,
  isValidGameEvent,
  isValidPosition,
  isValidRotation,
  isValidScale,
  logValidationWarning,
  safeValidateGameEvent,
  safeValidatePhysicsBodyConfig,
  safeValidatePosition,
  safeValidateRenderingConfig,
  safeValidateRotation,
  safeValidateScale,
  validateAudioOptions,
  validateDebugVisualization,
  validateGameEngineControls,
  validateGameEvent,
  validatePhysicsBodyConfig,
  validatePosition,
  validateRenderingConfig,
  validateRotation,
  validateScale,
  validateSystemUpdateConfig,
} from './lib/validation';

// Export types from validation
export type {
  IAudioControls,
  IAudioOptions,
  IDebugVisualization,
  IEventData,
  IGameEngineControls,
  IGameEvent,
  ILODConfig,
  IPhysicsBodyConfig,
  IPosition,
  IRenderingConfig,
  IRotation,
  IScale,
  ISystemUpdateConfig,
  IValidationQuaternion,
} from './lib/validation';

// UI Store with validation
export * from './stores/uiStore';

// Dynamic Component System - Unified
export { ComponentManager } from './dynamic-components/ComponentManager';
export { registerAllBuiltInComponents } from './lib/built-in-components';
export { registerBuiltInComponentGroups } from './lib/component-groups';
export {
  ComponentGroupManager,
  ComponentRegistry,
  DynamicComponentManager,
  componentManager,
  componentRegistry,
  dynamicComponentManager,
} from './lib/dynamic-components';
export { ArchetypeManager, registerBuiltInArchetypes } from './lib/entity-archetypes';
export * from './types/component-registry';

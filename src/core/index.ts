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
  addVelocity,
  createEntity,
  destroyEntity,
  entityToObject,
  markAllTransformsForUpdate,
  objectToEntity,
  resetWorld,
  Transform,
  transformQuery,
  Velocity,
  velocityQuery,
  world,
} from './lib/ecs';

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
  createValidationError,
  DebugVisualizationSchema,
  EventDataSchema,
  GameEngineControlsSchema,
  GameEventSchema,
  getDefaultPosition,
  getDefaultQuaternion,
  getDefaultRotation,
  getDefaultScale,
  isValidGameEvent,
  isValidPosition,
  isValidRotation,
  isValidScale,
  LODConfigSchema,
  logValidationWarning,
  PhysicsBodyConfigSchema,
  PositionSchema,
  QuaternionValidationSchema,
  RenderingConfigSchema,
  RotationSchema,
  safeValidateGameEvent,
  safeValidatePhysicsBodyConfig,
  safeValidatePosition,
  safeValidateRenderingConfig,
  safeValidateRotation,
  safeValidateScale,
  ScaleSchema,
  SystemUpdateConfigSchema,
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

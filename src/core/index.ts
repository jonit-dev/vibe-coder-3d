// Core Engine Exports
// This file exports all the core components, hooks, and utilities from the engine

// Components
// Note: EntityMesh and Entity components have been removed during ECS refactoring
export { EngineLoop } from './components/EngineLoop';
export {
  GameEngine,
  GameEnginePropsSchema,
  validateGameEngineProps,
} from './components/GameEngine';
export type { IGameEngineProps as GameEngineProps } from './components/GameEngine';

// Physics Components
export { PhysicsBody } from './components/physics/PhysicsBody';
export type {
  IPhysicsBodyHandle,
  IPhysicsBodyProps,
  IPhysicsMaterial,
  PhysicsBodyType,
} from './components/physics/PhysicsBody';

// Debug Components

// Hooks
export { useEntity } from './hooks/useEntity';
export { useGameEngine } from './hooks/useGameEngine';
export type { IGameEngineControls as GameEngineControls } from './hooks/useGameEngine';

// State
export { useGameLoop } from './lib/gameLoop';
export { useEngineStore } from './state/engineStore';

// ECS - New ComponentRegistry system
export { ComponentManager } from './lib/ecs/ComponentManager';
export { ComponentRegistry, componentRegistry } from './lib/ecs/ComponentRegistry';
export { EntityManager } from './lib/ecs/EntityManager';
export type { ComponentType, EntityId } from './lib/ecs/types';
export { ECSWorld as World } from './lib/ecs/World';

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
export { MaterialSystem } from './systems/MaterialSystem';
export { transformSystem } from './systems/transformSystem';

// Note: useAudio and useEvent hooks have been temporarily removed during ECS refactoring

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

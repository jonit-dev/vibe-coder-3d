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
export { KnownComponentTypes } from './lib/ecs/IComponent';

// Export EntityQueries for debugging and advanced usage
export { EntityQueries } from './lib/ecs/queries/entityQueries';

// Object Pooling
export { ObjectPool } from './lib/pooling/ObjectPool';
export type { IPoolable, IObjectPoolConfig, IObjectPoolStats } from './lib/pooling/ObjectPool';
export {
  Vector3Pool,
  acquireVector3,
  releaseVector3,
  withPooledVectors,
} from './lib/pooling/PooledVector3';
export type { IVector3Pooled } from './lib/pooling/PooledVector3';

// Rendering Utilities
export {
  computeCullingVolume,
  createLODManager,
  isCulled,
  optimizeMaterials,
  prepareForInstancing,
  textureUtils,
} from './lib/rendering';

// Materials
export { MaterialRegistry } from './materials/MaterialRegistry';
export type { IMaterialDefinition, IMaterialAssetMeta } from './materials/Material.types';

// Systems
export { MaterialSystem } from './systems/MaterialSystem';
export { transformSystem } from './systems/transformSystem';

// Note: useAudio and useEvent hooks have been temporarily removed during ECS refactoring

// Assets and Types with Zod validation
export * from './types/assets';
export * from './types/ecs';
export * from './types/scene';

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

// Extension Points for Game Projects
export {
  registerComponent,
  registerSystem,
  registerScript,
  registerPrefab,
  registerScene,
  initializeGameProject,
  getRegisteredComponents,
  getRegisteredSystems,
  getRegisteredScripts,
  getRegisteredPrefabs,
  getRegisteredScenes,
  getCurrentProjectConfig,
  getComponent,
  getSystem,
  getScript,
  getPrefab,
  getScene,
  runRegisteredSystems,
  runRegisteredScripts,
  initializeScriptForEntity,
  destroyScriptForEntity,
} from './lib/extension/GameExtensionPoints';

export type {
  IGameProjectConfig,
  IComponentDescriptor,
  ISystemDescriptor,
  IScriptDescriptor,
  IPrefabDescriptor,
  ISceneDescriptor,
} from './lib/extension/types';

// Project Asset Service
export { ProjectAssetService } from './lib/assets';

// Scene Registry
export { defineScene, loadScene, sceneRegistry } from './lib/scene/SceneRegistry';
export type { ISceneContext, SceneBuilder } from './lib/scene/SceneRegistry';

// Scene Serialization
export { SceneLoader } from './lib/serialization/SceneLoader';
export type { IStoreRefresher } from './lib/serialization/SceneLoader';

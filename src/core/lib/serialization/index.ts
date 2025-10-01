/**
 * Clean Serialization System
 * Following SRP, DRY, KISS principles
 */

// Core serializers (NEW - Clean architecture)
export { MaterialSerializer } from './MaterialSerializer';
export { PrefabSerializer } from './PrefabSerializer';
export { EntitySerializer } from './EntitySerializer';
export type {
  ISerializedEntity,
  IEntityManagerAdapter,
  IComponentManagerAdapter
} from './EntitySerializer';

// Orchestrators (NEW - Clean architecture)
export { SceneSerializer } from './SceneSerializer';
export type { ISceneMetadata, ISceneData } from './SceneSerializer';
export { SceneDeserializer } from './SceneDeserializer';

// High-level loader (NEW - Clean architecture)
export { SceneLoader } from './SceneLoader';
export type { IStoreRefresher } from './SceneLoader';

// Legacy streaming system (for editor/API)
export * from './StreamingSceneSerializer';
export * from './SceneDiff';

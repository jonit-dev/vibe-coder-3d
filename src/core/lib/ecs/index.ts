// Export the main ECS classes
export { EntityManager } from './EntityManager';
export { ECSWorld as World } from './World';

// Export types and interfaces
export { KnownComponentTypes } from './IComponent';
export type { IComponent, KnownComponentType } from './IComponent';
export type { IEntity } from './IEntity';
export type { ComponentType, EntityId } from './types';

// Export component data interfaces
export type { IMeshColliderData } from './components/MeshColliderComponent';
export type { IMeshRendererData } from './components/MeshRendererComponent';
export type { IRigidBodyData } from './components/RigidBodyComponent';
export type { ITransformData } from './components/TransformComponent';

// Export BitECS components and utilities
export {
  Camera,
  EntityMeta,
  MeshCollider,
  MeshRenderer,
  RigidBody,
  Transform,
} from './BitECSComponents';

export {
  getEntityName,
  getEntityParent,
  getMeshColliderData,
  getMeshRendererData,
  getRigidBodyData,
  getTransformData,
  setEntityMeta,
  setMeshColliderData,
  setMeshRendererData,
  setRigidBodyData,
  setTransformData,
} from './DataConversion';

// Export component registry
export * from './ComponentRegistry';

// Export utilities and improved converters
export * from './utils';

// Export specific converters for direct use
export {
  EntityMetaConverter,
  MeshColliderConverter,
  MeshRendererConverter,
  RigidBodyConverter,
  TransformConverter,
} from './utils/componentConverters';

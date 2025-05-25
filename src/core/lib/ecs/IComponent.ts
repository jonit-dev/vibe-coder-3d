import { ComponentType, EntityId } from './types';

export const KnownComponentTypes = {
  TRANSFORM: 'Transform',
  MESH_RENDERER: 'MeshRenderer',
  RIGID_BODY: 'RigidBody',
  MESH_COLLIDER: 'MeshCollider',
  CAMERA: 'Camera',
} as const;

export type KnownComponentType = (typeof KnownComponentTypes)[keyof typeof KnownComponentTypes];

// Generic component structure
export interface IComponent<TData = any> {
  entityId: EntityId;
  type: ComponentType;
  data: TData;
}

import { ComponentType, EntityId } from './types';

export const KnownComponentTypes = {
  TRANSFORM: 'Transform',
  MESH_RENDERER: 'MeshRenderer',
  RIGID_BODY: 'RigidBody',
  MESH_COLLIDER: 'MeshCollider',
  CAMERA: 'Camera',
  LIGHT: 'Light',
  SCRIPT: 'Script',
  SOUND: 'Sound',
  TERRAIN: 'Terrain',
  PERSISTENT_ID: 'PersistentId',
} as const;

export type KnownComponentType = (typeof KnownComponentTypes)[keyof typeof KnownComponentTypes];

// Generic component structure
export interface IComponent<TData = unknown> {
  entityId: EntityId;
  type: ComponentType;
  data: TData;
}

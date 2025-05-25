/**
 * Data conversion layer for BitECS components
 * Provides a simple interface for converting between component data and BitECS storage
 */

import { IMeshColliderData } from './components/MeshColliderComponent';
import { IMeshRendererData } from './components/MeshRendererComponent';
import { IRigidBodyData } from './components/RigidBodyComponent';
import { ITransformData } from './components/TransformComponent';
import { EntityId } from './types';
import {
  EntityMetaConverter,
  MeshColliderConverter,
  MeshRendererConverter,
  RigidBodyConverter,
  TransformConverter,
} from './utils/componentConverters';

// Re-export utilities for backward compatibility
export { hexToRgb, rgbToHex } from './utils/colorUtils';
export { getStringFromHash, hashString, storeString } from './utils/stringHashUtils';

// Transform data conversion - now using converters
export const setTransformData = (eid: EntityId, data: ITransformData): void => {
  TransformConverter.set(eid, data);
};

export const getTransformData = (eid: EntityId): ITransformData => {
  return TransformConverter.get(eid);
};

// MeshRenderer data conversion - now using converters
export const setMeshRendererData = (eid: EntityId, data: IMeshRendererData): void => {
  MeshRendererConverter.set(eid, data);
};

export const getMeshRendererData = (eid: EntityId): IMeshRendererData => {
  return MeshRendererConverter.get(eid);
};

// RigidBody data conversion - now using converters
export const setRigidBodyData = (eid: EntityId, data: IRigidBodyData): void => {
  RigidBodyConverter.set(eid, data);
};

export const getRigidBodyData = (eid: EntityId): IRigidBodyData => {
  return RigidBodyConverter.get(eid);
};

// MeshCollider data conversion - now using converters
export const setMeshColliderData = (eid: EntityId, data: IMeshColliderData): void => {
  MeshColliderConverter.set(eid, data);
};

export const getMeshColliderData = (eid: EntityId): IMeshColliderData => {
  return MeshColliderConverter.get(eid);
};

// Entity metadata conversion - now using converters
export const setEntityMeta = (eid: EntityId, name: string, parentId?: EntityId): void => {
  EntityMetaConverter.set(eid, name, parentId);
};

export const getEntityName = (eid: EntityId): string => {
  return EntityMetaConverter.getName(eid);
};

export const getEntityParent = (eid: EntityId): EntityId | undefined => {
  return EntityMetaConverter.getParent(eid);
};

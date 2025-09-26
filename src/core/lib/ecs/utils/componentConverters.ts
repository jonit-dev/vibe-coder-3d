/**
 * Component-specific data converters for BitECS components
 * Each converter handles one component type to follow SRP
 */

import {
  Camera,
  EntityMeta,
  MeshCollider,
  MeshRenderer,
  RigidBody,
  Transform,
} from '../BitECSComponents';
import { ICameraData } from '../components/CameraComponent';
import { IMeshColliderData } from '../components/MeshColliderComponent';
import { IMeshRendererData } from '../components/MeshRendererComponent';
import { IRigidBodyData } from '../components/RigidBodyComponent';
import { ITransformData } from '../components/TransformComponent';
import { EntityId } from '../types';

import { getRgbAsHex, setRgbValues } from './colorUtils';
import { getStringFromHash, storeString } from './stringHashUtils';

/**
 * Transform component converter
 */
export const TransformConverter = {
  set: (eid: EntityId, data: ITransformData): void => {
    Transform.positionX[eid] = data.position[0];
    Transform.positionY[eid] = data.position[1];
    Transform.positionZ[eid] = data.position[2];
    Transform.rotationX[eid] = data.rotation[0];
    Transform.rotationY[eid] = data.rotation[1];
    Transform.rotationZ[eid] = data.rotation[2];
    Transform.scaleX[eid] = data.scale[0];
    Transform.scaleY[eid] = data.scale[1];
    Transform.scaleZ[eid] = data.scale[2];
  },

  get: (eid: EntityId): ITransformData => ({
    position: [Transform.positionX[eid], Transform.positionY[eid], Transform.positionZ[eid]],
    rotation: [Transform.rotationX[eid], Transform.rotationY[eid], Transform.rotationZ[eid]],
    scale: [Transform.scaleX[eid], Transform.scaleY[eid], Transform.scaleZ[eid]],
  }),
};

/**
 * MeshRenderer component converter
 */
export const MeshRendererConverter = {
  set: (eid: EntityId, data: IMeshRendererData): void => {
    MeshRenderer.enabled[eid] = data.enabled ? 1 : 0;
    MeshRenderer.castShadows[eid] = data.castShadows ? 1 : 0;
    MeshRenderer.receiveShadows[eid] = data.receiveShadows ? 1 : 0;
    MeshRenderer.meshIdHash[eid] = storeString(data.meshId);
    MeshRenderer.materialIdHash[eid] = storeString(data.materialId);

    if (data.material) {
      MeshRenderer.materialType[eid] = data.material.materialType === 'texture' ? 1 : 0;

      setRgbValues(
        {
          r: MeshRenderer.materialColorR,
          g: MeshRenderer.materialColorG,
          b: MeshRenderer.materialColorB,
        },
        eid,
        data.material.color || '#3399ff',
      );

      MeshRenderer.metalness[eid] = data.material.metalness ?? 0;
      MeshRenderer.roughness[eid] = data.material.roughness ?? 0.5;

      setRgbValues(
        {
          r: MeshRenderer.emissiveR,
          g: MeshRenderer.emissiveG,
          b: MeshRenderer.emissiveB,
        },
        eid,
        data.material.emissive || '#000000',
      );

      MeshRenderer.emissiveIntensity[eid] = data.material.emissiveIntensity ?? 0;

      // Store texture hashes
      MeshRenderer.albedoTextureHash[eid] = data.material.albedoTexture
        ? storeString(data.material.albedoTexture)
        : 0;
      MeshRenderer.normalTextureHash[eid] = data.material.normalTexture
        ? storeString(data.material.normalTexture)
        : 0;
      MeshRenderer.metallicTextureHash[eid] = data.material.metallicTexture
        ? storeString(data.material.metallicTexture)
        : 0;
      MeshRenderer.roughnessTextureHash[eid] = data.material.roughnessTexture
        ? storeString(data.material.roughnessTexture)
        : 0;
      MeshRenderer.emissiveTextureHash[eid] = data.material.emissiveTexture
        ? storeString(data.material.emissiveTexture)
        : 0;
      MeshRenderer.occlusionTextureHash[eid] = data.material.occlusionTexture
        ? storeString(data.material.occlusionTexture)
        : 0;
    }
  },

  get: (eid: EntityId): IMeshRendererData => ({
    meshId: getStringFromHash(MeshRenderer.meshIdHash[eid]),
    materialId: getStringFromHash(MeshRenderer.materialIdHash[eid]),
    enabled: Boolean(MeshRenderer.enabled[eid]),
    castShadows: Boolean(MeshRenderer.castShadows[eid]),
    receiveShadows: Boolean(MeshRenderer.receiveShadows[eid]),
    material: {
      materialType: (MeshRenderer.materialType[eid] === 0 ? 'solid' : 'texture') as
        | 'solid'
        | 'texture',
      color: getRgbAsHex(
        {
          r: MeshRenderer.materialColorR,
          g: MeshRenderer.materialColorG,
          b: MeshRenderer.materialColorB,
        },
        eid,
      ),
      metalness: MeshRenderer.metalness[eid],
      roughness: MeshRenderer.roughness[eid],
      emissive: getRgbAsHex(
        {
          r: MeshRenderer.emissiveR,
          g: MeshRenderer.emissiveG,
          b: MeshRenderer.emissiveB,
        },
        eid,
      ),
      emissiveIntensity: MeshRenderer.emissiveIntensity[eid],
      // Texture properties
      albedoTexture: getStringFromHash(MeshRenderer.albedoTextureHash[eid]) || undefined,
      normalTexture: getStringFromHash(MeshRenderer.normalTextureHash[eid]) || undefined,
      metallicTexture: getStringFromHash(MeshRenderer.metallicTextureHash[eid]) || undefined,
      roughnessTexture: getStringFromHash(MeshRenderer.roughnessTextureHash[eid]) || undefined,
      emissiveTexture: getStringFromHash(MeshRenderer.emissiveTextureHash[eid]) || undefined,
      occlusionTexture: getStringFromHash(MeshRenderer.occlusionTextureHash[eid]) || undefined,
    },
  }),
};

/**
 * RigidBody component converter
 */
export const RigidBodyConverter = {
  set: (eid: EntityId, data: IRigidBodyData): void => {
    RigidBody.enabled[eid] = data.enabled ? 1 : 0;
    RigidBody.bodyTypeHash[eid] = storeString(data.bodyType || data.type || 'dynamic');
    RigidBody.mass[eid] = data.mass ?? 1;
    RigidBody.gravityScale[eid] = data.gravityScale ?? 1;
    RigidBody.canSleep[eid] = data.canSleep ? 1 : 0;

    if (data.material) {
      RigidBody.friction[eid] = data.material.friction ?? 0.7;
      RigidBody.restitution[eid] = data.material.restitution ?? 0.3;
      RigidBody.density[eid] = data.material.density ?? 1;
    }
  },

  get: (eid: EntityId): IRigidBodyData => {
    const bodyType = getStringFromHash(RigidBody.bodyTypeHash[eid]) || 'dynamic';
    return {
      enabled: Boolean(RigidBody.enabled[eid]),
      bodyType: bodyType as 'dynamic' | 'kinematic' | 'static',
      type: bodyType,
      mass: RigidBody.mass[eid],
      gravityScale: RigidBody.gravityScale[eid],
      canSleep: Boolean(RigidBody.canSleep[eid]),
      material: {
        friction: RigidBody.friction[eid],
        restitution: RigidBody.restitution[eid],
        density: RigidBody.density[eid],
      },
    };
  },
};

/**
 * MeshCollider component converter
 */
export const MeshColliderConverter = {
  set: (eid: EntityId, data: IMeshColliderData): void => {
    MeshCollider.enabled[eid] = data.enabled ? 1 : 0;
    MeshCollider.isTrigger[eid] = data.isTrigger ? 1 : 0;
    MeshCollider.shapeType[eid] = 0; // Default to box

    MeshCollider.offsetX[eid] = data.center[0];
    MeshCollider.offsetY[eid] = data.center[1];
    MeshCollider.offsetZ[eid] = data.center[2];

    MeshCollider.sizeX[eid] = data.size.width;
    MeshCollider.sizeY[eid] = data.size.height;
    MeshCollider.sizeZ[eid] = data.size.depth;
  },

  get: (eid: EntityId): IMeshColliderData => ({
    enabled: Boolean(MeshCollider.enabled[eid]),
    isTrigger: Boolean(MeshCollider.isTrigger[eid]),
    colliderType: 'box',
    center: [MeshCollider.offsetX[eid], MeshCollider.offsetY[eid], MeshCollider.offsetZ[eid]],
    size: {
      width: MeshCollider.sizeX[eid],
      height: MeshCollider.sizeY[eid],
      depth: MeshCollider.sizeZ[eid],
      radius: 0.5,
      capsuleRadius: 0.5,
      capsuleHeight: 2,
    },
    physicsMaterial: {
      friction: 0.7,
      restitution: 0.3,
      density: 1,
    },
  }),
};

/**
 * Camera component converter
 */
export const CameraConverter = {
  set: (eid: EntityId, data: ICameraData): void => {
    Camera.fov[eid] = data.fov;
    Camera.near[eid] = data.near;
    Camera.far[eid] = data.far;
    Camera.projectionType[eid] = data.projectionType === 'orthographic' ? 1 : 0;
    Camera.orthographicSize[eid] = data.orthographicSize;
    Camera.depth[eid] = data.depth;
    Camera.isMain[eid] = data.isMain ? 1 : 0;
    Camera.needsUpdate[eid] = 1; // Mark for update
  },

  get: (eid: EntityId): ICameraData => ({
    fov: Camera.fov[eid],
    near: Camera.near[eid],
    far: Camera.far[eid],
    projectionType: Camera.projectionType[eid] === 1 ? 'orthographic' : 'perspective',
    orthographicSize: Camera.orthographicSize[eid],
    depth: Camera.depth[eid],
    isMain: Boolean(Camera.isMain[eid]),
  }),
};

/**
 * EntityMeta converter for entity metadata
 */
export const EntityMetaConverter = {
  set: (eid: EntityId, name: string, parentId?: EntityId): void => {
    EntityMeta.nameHash[eid] = storeString(name);
    EntityMeta.parentEntity[eid] = parentId ?? -1;
  },

  getName: (eid: EntityId): string => getStringFromHash(EntityMeta.nameHash[eid]),

  getParent: (eid: EntityId): EntityId | undefined => {
    const parentEid = EntityMeta.parentEntity[eid];
    // -1 stored as unsigned becomes 4294967295
    const isNoParent = parentEid === 4294967295;
    return isNoParent ? undefined : parentEid;
  },
};

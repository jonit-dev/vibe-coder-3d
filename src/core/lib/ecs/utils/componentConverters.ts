/**
 * Component-specific data converters for BitECS components
 * Each converter handles one component type to follow SRP
 */

import { EntityMeta, MeshCollider, MeshRenderer, RigidBody, Transform } from '../BitECSComponents';
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
    }
  },

  get: (eid: EntityId): IMeshRendererData => ({
    meshId: getStringFromHash(MeshRenderer.meshIdHash[eid]),
    materialId: getStringFromHash(MeshRenderer.materialIdHash[eid]),
    enabled: Boolean(MeshRenderer.enabled[eid]),
    castShadows: Boolean(MeshRenderer.castShadows[eid]),
    receiveShadows: Boolean(MeshRenderer.receiveShadows[eid]),
    material: {
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
      bodyType: bodyType as any,
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
 * EntityMeta converter for entity metadata
 */
export const EntityMetaConverter = {
  set: (eid: EntityId, name: string, parentId?: EntityId): void => {
    EntityMeta.nameHash[eid] = storeString(name);
    EntityMeta.parentEntity[eid] = parentId || 0;
  },

  getName: (eid: EntityId): string => getStringFromHash(EntityMeta.nameHash[eid]),

  getParent: (eid: EntityId): EntityId | undefined => {
    const parentEid = EntityMeta.parentEntity[eid];
    return parentEid === 0 ? undefined : parentEid;
  },
};

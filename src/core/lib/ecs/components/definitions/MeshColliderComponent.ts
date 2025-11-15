/**
 * MeshCollider Component Definition
 * Handles physics collision detection shape
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';

// BitECS component interface for MeshCollider component
interface IMeshColliderBitECSComponent {
  enabled: { [eid: number]: number };
  isTrigger: { [eid: number]: number };
  shapeType: { [eid: number]: number };
  sizeX: { [eid: number]: number };
  sizeY: { [eid: number]: number };
  sizeZ: { [eid: number]: number };
  radius: { [eid: number]: number };
  capsuleRadius: { [eid: number]: number };
  capsuleHeight: { [eid: number]: number };
  offsetX: { [eid: number]: number };
  offsetY: { [eid: number]: number };
  offsetZ: { [eid: number]: number };
  friction: { [eid: number]: number };
  restitution: { [eid: number]: number };
  density: { [eid: number]: number };
}

// Define collider types
export type ColliderType = 'box' | 'sphere' | 'capsule' | 'mesh' | 'convex' | 'heightfield';

// MeshCollider Schema
const MeshColliderSchema = z.object({
  enabled: z.boolean(),
  isTrigger: z.boolean(),
  colliderType: z.enum(['box', 'sphere', 'capsule', 'mesh', 'convex', 'heightfield']),
  center: z.tuple([z.number(), z.number(), z.number()]),
  size: z.object({
    width: z.number(),
    height: z.number(),
    depth: z.number(),
    radius: z.number(),
    capsuleRadius: z.number(),
    capsuleHeight: z.number(),
  }),
  physicsMaterial: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

export type MeshColliderData = z.infer<typeof MeshColliderSchema>;

// MeshCollider Component Definition
export const meshColliderComponent = ComponentFactory.create({
  id: 'MeshCollider',
  name: 'Mesh Collider',
  category: ComponentCategory.Physics,
  schema: MeshColliderSchema,
  fields: {
    enabled: Types.ui8,
    isTrigger: Types.ui8,
    shapeType: Types.ui8,
    sizeX: Types.f32,
    sizeY: Types.f32,
    sizeZ: Types.f32,
    radius: Types.f32,
    capsuleRadius: Types.f32,
    capsuleHeight: Types.f32,
    offsetX: Types.f32,
    offsetY: Types.f32,
    offsetZ: Types.f32,
    friction: Types.f32,
    restitution: Types.f32,
    density: Types.f32,
  },
  serialize: (eid: number, bitECSComponent: unknown) => {
    const component = bitECSComponent as IMeshColliderBitECSComponent;
    // Map shapeType number to ColliderType string
    const shapeTypeMap: { [key: number]: ColliderType } = {
      0: 'box',
      1: 'sphere',
      2: 'capsule',
      3: 'mesh',
      4: 'convex',
      5: 'heightfield',
    };

    return {
      enabled: Boolean(component.enabled[eid]),
      isTrigger: Boolean(component.isTrigger[eid]),
      colliderType: shapeTypeMap[component.shapeType[eid]] || 'box',
      center: [component.offsetX[eid], component.offsetY[eid], component.offsetZ[eid]] as [
        number,
        number,
        number,
      ],
      size: {
        width: component.sizeX[eid] || 1,
        height: component.sizeY[eid] || 1,
        depth: component.sizeZ[eid] || 1,
        radius: component.radius[eid] || 0.5,
        capsuleRadius: component.capsuleRadius[eid] || 0.5,
        capsuleHeight: component.capsuleHeight[eid] || 2,
      },
      physicsMaterial: {
        friction: component.friction[eid] || 0.7,
        restitution: component.restitution[eid] || 0.3,
        density: component.density[eid] || 1,
      },
    };
  },
  deserialize: (eid: number, data: MeshColliderData, bitECSComponent: unknown) => {
    const component = bitECSComponent as IMeshColliderBitECSComponent;
    // Map ColliderType string to shapeType number
    const colliderTypeMap: { [key in ColliderType]: number } = {
      box: 0,
      sphere: 1,
      capsule: 2,
      mesh: 3,
      convex: 4,
      heightfield: 5,
    };

    component.enabled[eid] = data.enabled ? 1 : 0;
    component.isTrigger[eid] = data.isTrigger ? 1 : 0;
    component.shapeType[eid] = colliderTypeMap[data.colliderType] || 0;

    component.offsetX[eid] = data.center?.[0] || 0;
    component.offsetY[eid] = data.center?.[1] || 0;
    component.offsetZ[eid] = data.center?.[2] || 0;

    component.sizeX[eid] = data.size?.width || 1;
    component.sizeY[eid] = data.size?.height || 1;
    component.sizeZ[eid] = data.size?.depth || 1;
    component.radius[eid] = data.size?.radius || 0.5;
    component.capsuleRadius[eid] = data.size?.capsuleRadius || 0.5;
    component.capsuleHeight[eid] = data.size?.capsuleHeight || 2;

    component.friction[eid] = data.physicsMaterial?.friction || 0.7;
    component.restitution[eid] = data.physicsMaterial?.restitution || 0.3;
    component.density[eid] = data.physicsMaterial?.density || 1;
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics collision detection shape',
    version: '1.0.0',
  },
});

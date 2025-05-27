/**
 * MeshCollider Component Definition
 * Handles physics collision detection shape
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// MeshCollider Schema
const MeshColliderSchema = z.object({
  enabled: z.boolean(),
  isTrigger: z.boolean(),
  colliderType: z.string(),
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
    offsetX: Types.f32,
    offsetY: Types.f32,
    offsetZ: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => ({
    enabled: Boolean(component.enabled[eid]),
    isTrigger: Boolean(component.isTrigger[eid]),
    colliderType: 'box',
    center: [component.offsetX[eid], component.offsetY[eid], component.offsetZ[eid]],
    size: {
      width: component.sizeX[eid],
      height: component.sizeY[eid],
      depth: component.sizeZ[eid],
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
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = data.enabled ? 1 : 0;
    component.isTrigger[eid] = data.isTrigger ? 1 : 0;
    component.shapeType[eid] = 0; // Default to box

    component.offsetX[eid] = data.center[0];
    component.offsetY[eid] = data.center[1];
    component.offsetZ[eid] = data.center[2];

    component.sizeX[eid] = data.size.width;
    component.sizeY[eid] = data.size.height;
    component.sizeZ[eid] = data.size.depth;
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics collision detection shape',
    version: '1.0.0',
  },
});

export type MeshColliderData = z.infer<typeof MeshColliderSchema>;

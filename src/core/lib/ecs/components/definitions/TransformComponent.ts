/**
 * Transform Component Definition
 * Handles position, rotation, and scale in 3D space
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';

// Transform Schema
const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});

// Transform Component Definition
export const transformComponent = ComponentFactory.create({
  id: 'Transform',
  name: 'Transform',
  category: ComponentCategory.Core,
  schema: TransformSchema,
  fields: {
    positionX: Types.f32,
    positionY: Types.f32,
    positionZ: Types.f32,
    rotationX: Types.f32,
    rotationY: Types.f32,
    rotationZ: Types.f32,
    scaleX: Types.f32,
    scaleY: Types.f32,
    scaleZ: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => ({
    position: [component.positionX[eid], component.positionY[eid], component.positionZ[eid]] as [
      number,
      number,
      number,
    ],
    rotation: [component.rotationX[eid], component.rotationY[eid], component.rotationZ[eid]] as [
      number,
      number,
      number,
    ],
    scale: [component.scaleX[eid], component.scaleY[eid], component.scaleZ[eid]] as [
      number,
      number,
      number,
    ],
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    component.positionX[eid] = data.position[0];
    component.positionY[eid] = data.position[1];
    component.positionZ[eid] = data.position[2];
    component.rotationX[eid] = data.rotation[0];
    component.rotationY[eid] = data.rotation[1];
    component.rotationZ[eid] = data.rotation[2];
    component.scaleX[eid] = data.scale[0];
    component.scaleY[eid] = data.scale[1];
    component.scaleZ[eid] = data.scale[2];
  },
  metadata: {
    description: 'Position, rotation, and scale in 3D space',
    version: '1.0.0',
  },
});

export type TransformData = z.infer<typeof TransformSchema>;

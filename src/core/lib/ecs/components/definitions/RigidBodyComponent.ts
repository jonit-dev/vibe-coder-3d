/**
 * RigidBody Component Definition
 * Handles physics simulation body with mass and material properties
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// RigidBody Schema
const RigidBodySchema = z.object({
  enabled: z.boolean(),
  bodyType: z.string(),
  type: z.string().optional(), // Legacy support
  mass: z.number(),
  gravityScale: z.number(),
  canSleep: z.boolean(),
  material: z.object({
    friction: z.number(),
    restitution: z.number(),
    density: z.number(),
  }),
});

// RigidBody Component Definition
export const rigidBodyComponent = ComponentFactory.create({
  id: 'RigidBody',
  name: 'Rigid Body',
  category: ComponentCategory.Physics,
  schema: RigidBodySchema,
  fields: {
    enabled: Types.ui8,
    bodyTypeHash: Types.ui32,
    mass: Types.f32,
    gravityScale: Types.f32,
    canSleep: Types.ui8,
    friction: Types.f32,
    restitution: Types.f32,
    density: Types.f32,
  },
  serialize: (eid: EntityId, component: any) => {
    const bodyType = getStringFromHash(component.bodyTypeHash[eid]) || 'dynamic';
    return {
      enabled: Boolean(component.enabled[eid]),
      bodyType: bodyType as 'dynamic' | 'kinematic' | 'fixed',
      type: bodyType,
      mass: component.mass[eid],
      gravityScale: component.gravityScale[eid],
      canSleep: Boolean(component.canSleep[eid]),
      material: {
        friction: component.friction[eid],
        restitution: component.restitution[eid],
        density: component.density[eid],
      },
    };
  },
  deserialize: (eid: EntityId, data, component: any) => {
    component.enabled[eid] = data.enabled ? 1 : 0;
    component.bodyTypeHash[eid] = storeString(data.bodyType || data.type || 'dynamic');
    component.mass[eid] = data.mass ?? 1;
    component.gravityScale[eid] = data.gravityScale ?? 1;
    component.canSleep[eid] = data.canSleep ? 1 : 0;

    if (data.material) {
      component.friction[eid] = data.material.friction ?? 0.7;
      component.restitution[eid] = data.material.restitution ?? 0.3;
      component.density[eid] = data.material.density ?? 1;
    }
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics simulation body with mass and material properties',
    version: '1.0.0',
  },
});

export type RigidBodyData = z.infer<typeof RigidBodySchema>;

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

// BitECS component interface for RigidBody component
export interface IRigidBodyBitECSComponent {
  enabled: { [eid: number]: number };
  mass: { [eid: number]: number };
  gravityScale: { [eid: number]: number };
  canSleep: { [eid: number]: number };
  linearDamping: { [eid: number]: number };
  angularDamping: { [eid: number]: number };
  bodyTypeHash: { [eid: number]: number };
  restitution: { [eid: number]: number };
  friction: { [eid: number]: number };
  density: { [eid: number]: number };
}

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
  serialize: (eid: EntityId, component: unknown) => {
    const rigidBodyComponent = component as IRigidBodyBitECSComponent;
    const bodyType = getStringFromHash(rigidBodyComponent.bodyTypeHash[eid]) || 'dynamic';
    return {
      enabled: Boolean(rigidBodyComponent.enabled[eid]),
      bodyType: bodyType as 'dynamic' | 'kinematic' | 'fixed',
      type: bodyType,
      mass: rigidBodyComponent.mass[eid],
      gravityScale: rigidBodyComponent.gravityScale[eid],
      canSleep: Boolean(rigidBodyComponent.canSleep[eid]),
      material: {
        friction: rigidBodyComponent.friction[eid],
        restitution: rigidBodyComponent.restitution[eid],
        density: rigidBodyComponent.density[eid],
      },
    };
  },
  deserialize: (eid: EntityId, data: RigidBodyData, component: unknown) => {
    const rigidBodyComponent = component as IRigidBodyBitECSComponent;
    rigidBodyComponent.enabled[eid] = data.enabled ? 1 : 0;
    rigidBodyComponent.bodyTypeHash[eid] = storeString(data.bodyType || data.type || 'dynamic');
    rigidBodyComponent.mass[eid] = data.mass ?? 1;
    rigidBodyComponent.gravityScale[eid] = data.gravityScale ?? 1;
    rigidBodyComponent.canSleep[eid] = data.canSleep ? 1 : 0;

    if (data.material) {
      rigidBodyComponent.friction[eid] = data.material.friction ?? 0.7;
      rigidBodyComponent.restitution[eid] = data.material.restitution ?? 0.3;
      rigidBodyComponent.density[eid] = data.material.density ?? 1;
    }
  },
  dependencies: ['Transform'],
  metadata: {
    description: 'Physics simulation body with mass and material properties',
    version: '1.0.0',
  },
});

export type RigidBodyData = z.infer<typeof RigidBodySchema>;

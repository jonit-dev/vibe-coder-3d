import { z } from 'zod';
import React from 'react';
import { FiZap } from 'react-icons/fi';
import { ComponentManifest, IPhysicsContributions } from '../types';
import { ComponentCategory } from '@core/types/component-registry';

// Define Data Interface (RigidBodyData)
interface RigidBodyData {
  bodyType: 'dynamic' | 'kinematicPositionBased' | 'kinematicVelocityBased' | 'static';
  mass: number;
  enabled: boolean;
  gravityScale: number;
  canSleep: boolean;
  linearDamping: number; // Added based on typical RigidBody needs, adjust if not in old registry
  angularDamping: number; // Added based on typical RigidBody needs, adjust if not in old registry
  material: {
    friction: number;
    restitution: number;
    density: number;
  };
  // initialVelocity?: [number, number, number]; // Optional, if needed from old data
  // initialAngularVelocity?: [number, number, number]; // Optional, if needed
}

// Define Zod Schema (RigidBodySchema)
// Note: Rapier (used by R3F physics) uses 'kinematicPositionBased' and 'kinematicVelocityBased'
// The old 'kinematic' might map to 'kinematicPositionBased'. Defaulting to 'dynamic'.
const RigidBodySchema = z.object({
  bodyType: z.enum(['dynamic', 'kinematicPositionBased', 'kinematicVelocityBased', 'static']).default('dynamic'),
  mass: z.number().min(0).default(1),
  enabled: z.boolean().default(true),
  gravityScale: z.number().default(1),
  canSleep: z.boolean().default(true),
  linearDamping: z.number().default(0), // Default based on Rapier
  angularDamping: z.number().default(0), // Default based on Rapier
  material: z.object({
    friction: z.number().min(0).default(0.7),
    restitution: z.number().min(0).default(0.3),
    density: z.number().min(0).default(1),
  }),
  // initialVelocity: z.tuple([z.number(), z.number(), z.number()]).optional(),
  // initialAngularVelocity: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

// Create Manifest
const rigidBodyManifest: ComponentManifest<RigidBodyData> = {
  id: 'RigidBody', // From old KnownComponentTypes.RIGID_BODY
  name: 'Rigid Body',
  category: ComponentCategory.Physics,
  description: 'Enables physics simulation for an entity, making it a rigid body.',
  icon: React.createElement(FiZap, { className: 'w-4 h-4' }),
  schema: RigidBodySchema,
  getDefaultData: () => RigidBodySchema.parse({}),
  getPhysicsContributions: (data: RigidBodyData): IPhysicsContributions => {
    // Logic adapted from old ComponentRegistry.ts
    // The old registry had data.type and data.bodyType sometimes. Standardizing to data.bodyType.
    // It also had data.material.friction etc directly under rigidBodyProps in contributions.
    // The new structure for IPhysicsContributions has rigidBodyProps which then contains friction etc.
    // This adapter function maps the component's data to these contribution props.
    return {
      rigidBodyProps: {
        type: data.bodyType, // This will be used by the physics system
        mass: data.mass,
        friction: data.material.friction, // Pass material properties for the physics engine
        restitution: data.material.restitution,
        density: data.material.density, // Though density + colliders usually determine mass, it can be a direct prop
        gravityScale: data.gravityScale,
        canSleep: data.canSleep,
        linearDamping: data.linearDamping,
        angularDamping: data.angularDamping,
        // initialVelocity: data.initialVelocity,
        // initialAngularVelocity: data.initialAngularVelocity,
      },
      enabled: data.enabled, // Whether the physics body is active
    };
  },
  removable: true,
};

export default rigidBodyManifest;

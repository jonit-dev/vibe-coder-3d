import { z } from 'zod';
import React from 'react';
import { FiShield } from 'react-icons/fi';
import { ComponentManifest, IPhysicsContributions } from '../types';
import { ComponentCategory } from '@core/types/component-registry';

// Define Data Interface (MeshColliderData)
interface MeshColliderData {
  enabled: boolean;
  colliderType: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone' | 'hull' | 'trimesh'; // Common collider types
  isTrigger: boolean;
  center: [number, number, number];
  size: { // Size properties can vary based on colliderType
    width?: number;    // For box
    height?: number;   // For box, capsule, cylinder
    depth?: number;    // For box
    radius?: number;   // For sphere, capsule, cylinder, cone
    capsuleRadius?: number; // Rapier specific for capsule
    capsuleHeight?: number; // Rapier specific for capsule (half height)
    // For hull/trimesh, vertices/indices would be needed, complex for generic schema.
    // For now, focusing on primitives.
  };
  physicsMaterial: { // Renamed from 'material' in some old contexts to avoid confusion
    friction: number;
    restitution: number;
    density: number; // Often used to calculate mass if not overridden by RigidBody
  };
}

// Define Zod Schema (MeshColliderSchema)
const MeshColliderSchema = z.object({
  enabled: z.boolean().default(true),
  colliderType: z.enum(['box', 'sphere', 'capsule', 'cylinder', 'cone', 'hull', 'trimesh']).default('box'),
  isTrigger: z.boolean().default(false),
  center: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  size: z.object({ // Defaulting to a 1x1x1 box equivalent
    width: z.number().optional().default(1),
    height: z.number().optional().default(1),
    depth: z.number().optional().default(1),
    radius: z.number().optional().default(0.5), // Default for sphere/capsule
    capsuleRadius: z.number().optional().default(0.5),
    capsuleHeight: z.number().optional().default(1), // Half height of the cylindrical part
  }).default({ width: 1, height: 1, depth: 1, radius: 0.5, capsuleRadius: 0.5, capsuleHeight: 1}),
  physicsMaterial: z.object({
    friction: z.number().min(0).default(0.7),
    restitution: z.number().min(0).default(0.3),
    density: z.number().min(0).default(1),
  }),
});

// Create Manifest
const meshColliderManifest: ComponentManifest<MeshColliderData> = {
  id: 'MeshCollider', // From old KnownComponentTypes.MESH_COLLIDER
  name: 'Mesh Collider',
  category: ComponentCategory.Physics,
  description: 'Defines the collision shape for an entity.',
  icon: React.createElement(FiShield, { className: 'w-4 h-4' }),
  schema: MeshColliderSchema,
  getDefaultData: () => MeshColliderSchema.parse({}),
  getPhysicsContributions: (data: MeshColliderData): IPhysicsContributions => {
    // Logic adapted from old ComponentRegistry.ts
    // The old registry version mainly contributed material properties.
    // A full collider contribution would be more complex and involve geometry generation.
    // For now, following the old pattern of primarily contributing material aspects
    // and assuming the actual collider geometry setup happens elsewhere based on 'colliderType' and 'size'.
    if (!data.enabled) {
      return { enabled: false };
    }

    // The primary role of MeshCollider's physics contribution here is to provide
    // material properties. The actual collider shape definition will be used by
    // the physics system when constructing the physics body.
    // We can also pass collider-specific properties if IPhysicsContributions supports it.
    // For now, it mostly affects rigidBodyProps.
    return {
      // Colliders would be defined more explicitly here if IPhysicsContributions had a more detailed structure for them.
      // e.g., colliders: [{ type: data.colliderType, size: data.size, material: data.physicsMaterial, isTrigger: data.isTrigger }]
      // For now, we pass material properties that might influence the overall rigid body.
      rigidBodyProps: { // These props might merge with or be overridden by RigidBody component's contributions
        friction: data.physicsMaterial.friction,
        restitution: data.physicsMaterial.restitution,
        density: data.physicsMaterial.density, // Density is often part of collider definition
      },
      // It's important that the physics system knows this entity *has* a collider.
      // This can be implicit if rigidBodyProps are present, or explicit.
      // Adding a conceptual 'hasCollider' or similar if the system needs it.
      // For now, enabling physics contributions means a collider is intended.
      enabled: data.enabled,
      // If IPhysicsContributions had a specific field for colliders:
      // colliders: [
      //   {
      //     type: data.colliderType,
      //     isTrigger: data.isTrigger,
      //     center: data.center,
      //     size: data.size,
      //     material: data.physicsMaterial,
      //   }
      // ]
    };
  },
  removable: true,
};

export default meshColliderManifest;

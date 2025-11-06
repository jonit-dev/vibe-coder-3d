/**
 * Character Physics Types
 * Defines interfaces for character motor and kinematic body control
 */

import type {
  RigidBody as RapierRigidBody,
  Collider as RapierCollider,
} from '@dimforge/rapier3d-compat';

/**
 * Character motor configuration
 * Controls movement parameters and physical constraints
 */
export interface ICharacterMotorConfig {
  /** Maximum horizontal movement speed (m/s) */
  maxSpeed: number;

  /** Initial vertical velocity for jump (m/s) */
  jumpStrength: number;

  /** Gravity acceleration multiplier (default 1.0 = -9.81 m/s²) */
  gravity: number;

  /** Maximum climbable slope angle in degrees (0-90) */
  slopeLimitDeg: number;

  /** Maximum step height character can climb (meters) */
  stepOffset: number;

  /** Collision skin width for character controller (meters) */
  skinWidth: number;

  /** Maximum vertical speed to allow ground snapping (m/s) */
  snapMaxSpeed: number;

  /** Maximum depenetration distance per frame (meters) */
  maxDepenetrationPerFrame: number;

  /** Force multiplier when pushing dynamic objects */
  pushStrength: number;

  /** Maximum mass of objects that can be pushed (kg, 0 = unlimited) */
  maxPushMass: number;
}

/**
 * Entity physics references stored in registry
 * Maps entity ID to its Rapier physics handles
 */
export interface IEntityPhysicsRefs {
  /** Rapier rigid body handle (optional, kinematic body for character) */
  rigidBody?: RapierRigidBody;

  /** Array of collider handles associated with this entity */
  colliders: RapierCollider[];
}

/**
 * 3D vector type for movement and forces
 */
export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

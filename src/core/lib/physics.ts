// Core Physics implementation for Vibe Coder 3D
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useCallback, useMemo } from 'react';
import { Vector3 } from 'three';

import { useGameLoop } from './gameLoop';

// Export types from Rapier for convenience
export { ColliderDesc, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';

// Define key physics constants
export const PHYSICS_UPDATE_RATE = 1 / 60; // 60Hz physics updates
export const MAX_PHYSICS_STEPS = 3; // Maximum physics steps per frame to prevent spiral of death

// Physics body type union for better TypeScript support
export type PhysicsBodyType = 'dynamic' | 'kinematicPosition' | 'kinematicVelocity' | 'fixed';

// Shape types for colliders
export type PhysicsShape =
  | { type: 'box'; width: number; height: number; depth: number }
  | { type: 'sphere'; radius: number }
  | { type: 'capsule'; height: number; radius: number }
  | { type: 'cylinder'; height: number; radius: number }
  | { type: 'cone'; height: number; radius: number }
  | { type: 'cuboid'; x: number; y: number; z: number }
  | { type: 'ball'; radius: number };

// Physics material properties
export interface IPhysicsMaterial {
  friction?: number;
  restitution?: number;
  density?: number;
  frictionCombineRule?: 'average' | 'min' | 'multiply' | 'max';
  restitutionCombineRule?: 'average' | 'min' | 'multiply' | 'max';
}

/**
 * Hook to access the Rapier world instance and physics utility functions
 */
export function usePhysics() {
  const { world, rapier } = useRapier();

  // Memoized utility functions for better performance
  const utils = useMemo(
    () => ({
      // Create a ray for raycasting
      createRay: (origin: [number, number, number], direction: [number, number, number]) => {
        return new rapier.Ray(
          { x: origin[0], y: origin[1], z: origin[2] },
          { x: direction[0], y: direction[1], z: direction[2] },
        );
      },

      // Cast a ray and return the first hit
      raycast: (
        origin: [number, number, number],
        direction: [number, number, number],
        maxToi = 100,
      ) => {
        const ray = new rapier.Ray(
          { x: origin[0], y: origin[1], z: origin[2] },
          { x: direction[0], y: direction[1], z: direction[2] },
        );

        return world.castRay(ray, maxToi, true);
      },

      // Cast multiple rays and return all hits
      raycastAll: (
        origin: [number, number, number],
        direction: [number, number, number],
        maxToi = 100,
      ) => {
        const ray = new rapier.Ray(
          { x: origin[0], y: origin[1], z: origin[2] },
          { x: direction[0], y: direction[1], z: direction[2] },
        );

        const hits: any[] = [];
        world.intersectionsWithRay(ray, maxToi, true, (hit) => {
          hits.push(hit);
          return true; // Continue to find all hits
        });

        return hits;
      },

      // Check if a point is inside any collider
      pointIntersection: (point: [number, number, number]) => {
        return world.intersectionsWithPoint({ x: point[0], y: point[1], z: point[2] }, () => true);
      },

      // Create a physics shape descriptor
      createShape: (shape: PhysicsShape): any => {
        switch (shape.type) {
          case 'box':
            return rapier.ColliderDesc.cuboid(shape.width / 2, shape.height / 2, shape.depth / 2);
          case 'cuboid':
            return rapier.ColliderDesc.cuboid(shape.x / 2, shape.y / 2, shape.z / 2);
          case 'sphere':
          case 'ball':
            return rapier.ColliderDesc.ball(shape.radius);
          case 'capsule':
            return rapier.ColliderDesc.capsule(shape.height / 2, shape.radius);
          case 'cylinder':
            return rapier.ColliderDesc.cylinder(shape.height / 2, shape.radius);
          case 'cone':
            return rapier.ColliderDesc.cone(shape.height / 2, shape.radius);
          default:
            throw new Error(`Unsupported shape type: ${(shape as any).type}`);
        }
      },

      // Apply material properties to a collider descriptor
      applyMaterial: (colliderDesc: any, material?: IPhysicsMaterial) => {
        if (!material) return colliderDesc;

        if (material.friction !== undefined) colliderDesc.setFriction(material.friction);
        if (material.restitution !== undefined) colliderDesc.setRestitution(material.restitution);
        if (material.density !== undefined) colliderDesc.setDensity(material.density);

        // Note: CoefficientCombineRule access needs to be handled differently
        // if (material.frictionCombineRule) {
        //   const rule = rapier.CoefficientCombineRule[material.frictionCombineRule];
        //   colliderDesc.setFrictionCombineRule(rule);
        // }

        // if (material.restitutionCombineRule) {
        //   const rule = rapier.CoefficientCombineRule[material.restitutionCombineRule];
        //   colliderDesc.setRestitutionCombineRule(rule);
        // }

        return colliderDesc;
      },
    }),
    [world, rapier],
  );

  // Physics body manipulation functions
  const bodyUtils = useMemo(
    () => ({
      // Apply force to a rigid body
      applyForce: (
        body: any,
        force: Vector3 | [number, number, number],
        point?: Vector3 | [number, number, number],
      ) => {
        const forceVec = Array.isArray(force)
          ? { x: force[0], y: force[1], z: force[2] }
          : { x: force.x, y: force.y, z: force.z };

        if (point) {
          const pointVec = Array.isArray(point)
            ? { x: point[0], y: point[1], z: point[2] }
            : { x: point.x, y: point.y, z: point.z };
          body.addForceAtPoint(forceVec, pointVec, true);
        } else {
          body.addForce(forceVec, true);
        }
      },

      // Apply impulse to a rigid body
      applyImpulse: (
        body: any,
        impulse: Vector3 | [number, number, number],
        point?: Vector3 | [number, number, number],
      ) => {
        const impulseVec = Array.isArray(impulse)
          ? { x: impulse[0], y: impulse[1], z: impulse[2] }
          : { x: impulse.x, y: impulse.y, z: impulse.z };

        if (point) {
          const pointVec = Array.isArray(point)
            ? { x: point[0], y: point[1], z: point[2] }
            : { x: point.x, y: point.y, z: point.z };
          body.applyImpulseAtPoint(impulseVec, pointVec, true);
        } else {
          body.applyImpulse(impulseVec, true);
        }
      },

      // Apply torque to a rigid body
      applyTorque: (body: any, torque: Vector3 | [number, number, number]) => {
        const torqueVec = Array.isArray(torque)
          ? { x: torque[0], y: torque[1], z: torque[2] }
          : { x: torque.x, y: torque.y, z: torque.z };
        body.addTorque(torqueVec, true);
      },

      // Apply angular impulse to a rigid body
      applyAngularImpulse: (body: any, impulse: Vector3 | [number, number, number]) => {
        const impulseVec = Array.isArray(impulse)
          ? { x: impulse[0], y: impulse[1], z: impulse[2] }
          : { x: impulse.x, y: impulse.y, z: impulse.z };
        body.applyTorqueImpulse(impulseVec, true);
      },

      // Set velocity of a rigid body
      setVelocity: (body: any, velocity: Vector3 | [number, number, number]) => {
        const velocityVec = Array.isArray(velocity)
          ? { x: velocity[0], y: velocity[1], z: velocity[2] }
          : { x: velocity.x, y: velocity.y, z: velocity.z };
        body.setLinvel(velocityVec, true);
      },

      // Set angular velocity of a rigid body
      setAngularVelocity: (body: any, velocity: Vector3 | [number, number, number]) => {
        const velocityVec = Array.isArray(velocity)
          ? { x: velocity[0], y: velocity[1], z: velocity[2] }
          : { x: velocity.x, y: velocity.y, z: velocity.z };
        body.setAngvel(velocityVec, true);
      },

      // Get velocity of a rigid body
      getVelocity: (body: any): Vector3 => {
        const vel = body.linvel();
        return new Vector3(vel.x, vel.y, vel.z);
      },

      // Get angular velocity of a rigid body
      getAngularVelocity: (body: any): Vector3 => {
        const vel = body.angvel();
        return new Vector3(vel.x, vel.y, vel.z);
      },
    }),
    [],
  );

  return {
    world,
    rapier,
    ...utils,
    body: bodyUtils,
  };
}

/**
 * Component to advance the physics simulation in sync with the game loop
 * This should be used inside the EngineLoop component
 */
export function usePhysicsSystem() {
  const { world } = useRapier();
  const { isRunning, isPaused } = useGameLoop();

  // Accumulated time for fixed timestep physics
  let accumulatedTime = 0;

  useFrame((_, delta) => {
    // Skip physics update if game is not running or is paused
    if (!isRunning || isPaused) return;

    // Accumulate time and step physics in fixed intervals
    accumulatedTime += delta;

    // Cap the number of physics steps to prevent spiral of death
    let steps = 0;

    while (accumulatedTime >= PHYSICS_UPDATE_RATE && steps < MAX_PHYSICS_STEPS) {
      world.step();
      accumulatedTime -= PHYSICS_UPDATE_RATE;
      steps++;
    }

    // If we had to cap the physics steps, reset accumulated time
    // This can cause minor physics inaccuracies but prevents the simulation from slowing down
    if (steps >= MAX_PHYSICS_STEPS && accumulatedTime >= PHYSICS_UPDATE_RATE) {
      accumulatedTime = 0;
    }
  });
}

/**
 * Hook for physics events and collision detection
 */
export function usePhysicsEvents() {
  const { world } = useRapier();

  const addCollisionHandler = useCallback(
    (_handler: (event: any) => void) => {
      // Add collision event handlers
      // Note: This is a simplified version - in practice you'd want to use
      // the event system from @react-three/rapier
      return () => {
        // Cleanup function
      };
    },
    [world],
  );

  return {
    addCollisionHandler,
  };
}

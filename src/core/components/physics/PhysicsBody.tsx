// PhysicsBody.tsx - Enhanced physics body component with better API
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useRef } from 'react';
import { Euler, Quaternion } from 'three';

import { useECS } from '../../hooks/useECS';
import { Transform } from '../../lib/ecs';
import { IPhysicsMaterial, PhysicsBodyType, usePhysics } from '../../lib/physics';
import { registerPhysicsBody, unregisterPhysicsBody } from '../../systems/PhysicsSyncSystem';

// Extended props for the PhysicsBody component
export interface IPhysicsBodyProps {
  children: ReactNode;

  // Basic transform props
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];

  // Physics properties
  bodyType?: PhysicsBodyType;
  material?: IPhysicsMaterial;

  // ECS integration
  autoRegister?: boolean;
  entityId?: number; // Allow external entity control

  // Debug and metadata
  debug?: boolean;
  userData?: any; // Custom data to attach to the physics body
  tags?: string[]; // Tags for filtering and identification

  // Physics configuration
  mass?: number;
  canSleep?: boolean;
  gravityScale?: number;

  // Initial forces/velocities
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];

  // Pass through any other RigidBody props
  [key: string]: any;
}

// PhysicsBody handle for imperative control
export interface IPhysicsBodyHandle {
  body: RapierRigidBody | null;
  entityId: number | null;
  applyForce: (force: [number, number, number], point?: [number, number, number]) => void;
  applyImpulse: (impulse: [number, number, number], point?: [number, number, number]) => void;
  setVelocity: (velocity: [number, number, number]) => void;
  setAngularVelocity: (velocity: [number, number, number]) => void;
  wakeUp: () => void;
  sleep: () => void;
}

/**
 * PhysicsBody - Enhanced physics body component with better API and ECS integration
 *
 * This component provides a more user-friendly interface for creating physics bodies
 * with automatic ECS integration and comprehensive physics control.
 */
export const PhysicsBody = forwardRef<IPhysicsBodyHandle, IPhysicsBodyProps>(
  (
    {
      children,
      bodyType = 'dynamic',
      material,
      autoRegister = true,
      entityId: externalEntityId,
      debug = false,
      userData,
      tags = [],
      mass,
      canSleep = true,
      gravityScale = 1,
      initialVelocity,
      initialAngularVelocity,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      ...rigidBodyProps
    },
    ref,
  ) => {
    // References
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const entityRef = useRef<number | null>(null);

    // ECS and physics hooks
    const { createEntity, destroyEntity } = useECS();
    const physics = usePhysics();

    // Convert our body type to Rapier type
    const rapierBodyType =
      bodyType === 'dynamic'
        ? 'dynamic'
        : bodyType === 'kinematicPosition'
          ? 'kinematicPosition'
          : bodyType === 'kinematicVelocity'
            ? 'kinematicVelocity'
            : 'fixed';

    // Setup entity and ECS integration
    useEffect(() => {
      if (autoRegister && rigidBodyRef.current) {
        // Use external entity ID or create a new one
        const entity = externalEntityId ?? createEntity();
        entityRef.current = entity;

        // Set initial transform values
        if (Array.isArray(position) && position.length === 3) {
          Transform.position[entity][0] = position[0];
          Transform.position[entity][1] = position[1];
          Transform.position[entity][2] = position[2];
        }

        // Set rotation if provided
        if (Array.isArray(rotation) && rotation.length === 3) {
          // Convert Euler to quaternion if needed
          const quaternion = new Quaternion().setFromEuler(
            new Euler(rotation[0], rotation[1], rotation[2]),
          );
          Transform.rotation[entity][0] = quaternion.x;
          Transform.rotation[entity][1] = quaternion.y;
          Transform.rotation[entity][2] = quaternion.z;
          Transform.rotation[entity][3] = quaternion.w;
        }

        // Register the physics body with ECS
        registerPhysicsBody(entity, rigidBodyRef.current as any);

        // Apply initial physics properties
        const body = rigidBodyRef.current;

        // Apply initial velocities
        if (initialVelocity && body.setLinvel) {
          body.setLinvel(
            { x: initialVelocity[0], y: initialVelocity[1], z: initialVelocity[2] },
            true,
          );
        }

        if (initialAngularVelocity && body.setAngvel) {
          body.setAngvel(
            {
              x: initialAngularVelocity[0],
              y: initialAngularVelocity[1],
              z: initialAngularVelocity[2],
            },
            true,
          );
        }

        // Store userData and tags
        if (userData || tags.length > 0) {
          body.userData = { ...userData, tags, entityId: entity };
        }

        if (debug) {
          console.log(`Created physics body entity: ${entity}`, {
            bodyType,
            material,
            userData,
            tags,
          });
        }

        // Cleanup on unmount
        return () => {
          if (entityRef.current !== null) {
            unregisterPhysicsBody(entityRef.current);

            // Only destroy entity if we created it (not external)
            if (!externalEntityId) {
              destroyEntity(entityRef.current);
            }

            if (debug) {
              console.log(`Destroyed physics body entity: ${entityRef.current}`);
            }

            entityRef.current = null;
          }
        };
      }
    }, [
      autoRegister,
      externalEntityId,
      createEntity,
      destroyEntity,
      debug,
      position,
      rotation,
      mass,
      canSleep,
      gravityScale,
      initialVelocity,
      initialAngularVelocity,
      userData,
      tags,
    ]);

    // Imperative handle for external control
    useImperativeHandle(
      ref,
      () => ({
        body: rigidBodyRef.current,
        entityId: entityRef.current,

        applyForce: (force: [number, number, number], point?: [number, number, number]) => {
          if (rigidBodyRef.current) {
            physics.body.applyForce(rigidBodyRef.current, force, point);
          }
        },

        applyImpulse: (impulse: [number, number, number], point?: [number, number, number]) => {
          if (rigidBodyRef.current) {
            physics.body.applyImpulse(rigidBodyRef.current, impulse, point);
          }
        },

        setVelocity: (velocity: [number, number, number]) => {
          if (rigidBodyRef.current) {
            physics.body.setVelocity(rigidBodyRef.current, velocity);
          }
        },

        setAngularVelocity: (velocity: [number, number, number]) => {
          if (rigidBodyRef.current) {
            physics.body.setAngularVelocity(rigidBodyRef.current, velocity);
          }
        },

        wakeUp: () => {
          if (rigidBodyRef.current && rigidBodyRef.current.wakeUp) {
            rigidBodyRef.current.wakeUp();
          }
        },

        sleep: () => {
          if (rigidBodyRef.current && rigidBodyRef.current.sleep) {
            rigidBodyRef.current.sleep();
          }
        },
      }),
      [physics],
    );

    return (
      <RigidBody
        ref={rigidBodyRef}
        type={rapierBodyType}
        position={position}
        rotation={rotation}
        scale={scale}
        {...rigidBodyProps}
      >
        {children}
      </RigidBody>
    );
  },
);

PhysicsBody.displayName = 'PhysicsBody';

export { PhysicsBody as default };

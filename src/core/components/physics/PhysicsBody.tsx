// PhysicsBody.tsx - Enhanced physics body component with better API
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { forwardRef, ReactNode, useEffect, useImperativeHandle, useRef } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';

// Physics material interface (simplified for now)
export interface IPhysicsMaterial {
  friction?: number;
  restitution?: number;
  density?: number;
}

// Physics body types
export type PhysicsBodyType = 'dynamic' | 'kinematicPosition' | 'kinematicVelocity' | 'fixed';

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

    // ECS hooks
    const entityManager = useEntityManager();
    const componentManager = useComponentManager();

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
        const entity =
          externalEntityId ?? entityManager.createEntity(`PhysicsBody_${Date.now()}`).id;
        entityRef.current = entity;

        // Set initial transform values using the new ComponentRegistry system
        const transformData: ITransformData = {
          position: [...position] as [number, number, number],
          rotation: [...rotation] as [number, number, number],
          scale: [...scale] as [number, number, number],
        };

        // Add or update Transform component
        const existingTransform = componentManager.getComponent(
          entity,
          KnownComponentTypes.TRANSFORM,
        );
        if (existingTransform) {
          componentManager.updateComponent(entity, KnownComponentTypes.TRANSFORM, transformData);
        } else {
          componentManager.addComponent(entity, KnownComponentTypes.TRANSFORM, transformData);
        }

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
          // Physics body entity created successfully
        }

        // Cleanup on unmount
        return () => {
          if (entityRef.current !== null) {
            // Only destroy entity if we created it (not external)
            if (!externalEntityId) {
              entityManager.deleteEntity(entityRef.current);
            }

            if (debug) {

            }

            entityRef.current = null;
          }
        };
      }
    }, [
      autoRegister,
      externalEntityId,
      entityManager,
      componentManager,
      debug,
      position,
      rotation,
      scale,
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
          if (rigidBodyRef.current && rigidBodyRef.current.addForce) {
            const forceVector = { x: force[0], y: force[1], z: force[2] };
            if (point) {
              const pointVector = { x: point[0], y: point[1], z: point[2] };
              rigidBodyRef.current.addForceAtPoint(forceVector, pointVector, true);
            } else {
              rigidBodyRef.current.addForce(forceVector, true);
            }
          }
        },

        applyImpulse: (impulse: [number, number, number], point?: [number, number, number]) => {
          if (rigidBodyRef.current && rigidBodyRef.current.applyImpulse) {
            const impulseVector = { x: impulse[0], y: impulse[1], z: impulse[2] };
            if (point) {
              const pointVector = { x: point[0], y: point[1], z: point[2] };
              rigidBodyRef.current.applyImpulseAtPoint(impulseVector, pointVector, true);
            } else {
              rigidBodyRef.current.applyImpulse(impulseVector, true);
            }
          }
        },

        setVelocity: (velocity: [number, number, number]) => {
          if (rigidBodyRef.current && rigidBodyRef.current.setLinvel) {
            rigidBodyRef.current.setLinvel(
              { x: velocity[0], y: velocity[1], z: velocity[2] },
              true,
            );
          }
        },

        setAngularVelocity: (velocity: [number, number, number]) => {
          if (rigidBodyRef.current && rigidBodyRef.current.setAngvel) {
            rigidBodyRef.current.setAngvel(
              { x: velocity[0], y: velocity[1], z: velocity[2] },
              true,
            );
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
      [],
    );

    return (
      <RigidBody
        ref={rigidBodyRef}
        type={rapierBodyType}
        position={position}
        rotation={rotation}
        scale={scale}
        mass={mass}
        canSleep={canSleep}
        gravityScale={gravityScale}
        {...rigidBodyProps}
      >
        {children}
      </RigidBody>
    );
  },
);

PhysicsBody.displayName = 'PhysicsBody';

export { PhysicsBody as default };

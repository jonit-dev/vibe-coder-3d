// PhysicsObject.tsx - Base component for physics objects with ECS integration
import { RapierRigidBody, RigidBody, RigidBodyProps } from '@react-three/rapier';
import { ReactNode, useEffect, useRef } from 'react';

import { useECS } from '../../hooks/useECS';
import { Transform } from '../../lib/ecs';
import { registerPhysicsBody, unregisterPhysicsBody } from '../../systems/PhysicsSyncSystem';

// Extend RigidBodyProps to include additional options
export interface PhysicsObjectProps extends RigidBodyProps {
  children: ReactNode;
  onCollide?: (otherEntity: number) => void;
  autoRegister?: boolean; // Whether to automatically register with ECS
  debug?: boolean; // Whether to show debug info
}

/**
 * PhysicsObject - A base component for physics objects that integrates with ECS
 *
 * This component wraps RigidBody from react-three/rapier and automatically
 * creates and manages an ECS entity for the physics body.
 */
export const PhysicsObject = ({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  onCollide,
  autoRegister = true,
  debug = false,
  ...rigidBodyProps
}: PhysicsObjectProps) => {
  // Reference to the rapier rigid body
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // ECS hooks
  const { createEntity, destroyEntity } = useECS();

  // Entity reference
  const entityRef = useRef<number | null>(null);

  // Register with ECS when mounted
  useEffect(() => {
    if (autoRegister && rigidBodyRef.current) {
      // Create an ECS entity
      const entity = createEntity();
      entityRef.current = entity;

      // Set initial transform values
      if (Array.isArray(position) && position.length === 3) {
        Transform.position[entity][0] = position[0];
        Transform.position[entity][1] = position[1];
        Transform.position[entity][2] = position[2];
      }

      // Register the physics body with ECS
      registerPhysicsBody(entity, rigidBodyRef.current as any);

      if (debug) {
        console.log(`Created physics entity: ${entity}`);
      }

      // Clean up on unmount
      return () => {
        if (entityRef.current !== null) {
          unregisterPhysicsBody(entityRef.current);
          destroyEntity(entityRef.current);
          entityRef.current = null;

          if (debug) {
            console.log(`Destroyed physics entity: ${entity}`);
          }
        }
      };
    }
  }, [autoRegister, createEntity, destroyEntity, debug, position]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      scale={scale}
      {...rigidBodyProps}
    >
      {children}
    </RigidBody>
  );
};

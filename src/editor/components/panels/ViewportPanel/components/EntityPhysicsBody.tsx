import React, { useEffect, useRef } from 'react';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import type { Collider as RapierCollider } from '@dimforge/rapier3d-compat';
import { useFrame } from '@react-three/fiber';
import type { IPhysicsContributions } from '../hooks/useEntityMesh';
import { EntityColliders } from './EntityColliders';
import { Logger } from '@/core/lib/logger';
import {
  registerRigidBody,
  unregisterRigidBody,
} from '@/core/lib/scripting/adapters/physics-binding';
import { useEntityContextOptional } from '@/core/components/jsx/EntityContext';
import { colliderRegistry } from '@/core/physics/character/ColliderRegistry';
import type { IEntityPhysicsRefs } from '@/core/physics/character/types';

interface IEntityPhysicsBodyProps {
  terrainColliderKey: string;
  physicsContributions?: IPhysicsContributions;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
  enhancedColliderConfig: any;
  hasCustomColliders: boolean;
  hasEffectiveCustomColliders: boolean;
  colliderType: string;
  children: React.ReactNode;
}

export const EntityPhysicsBody: React.FC<IEntityPhysicsBodyProps> = React.memo(
  ({
    terrainColliderKey,
    physicsContributions,
    position,
    rotationRadians,
    scale,
    enhancedColliderConfig,
    hasCustomColliders,
    hasEffectiveCustomColliders,
    colliderType,
    children,
  }) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const entityContext = useEntityContextOptional();
    const entityId = entityContext?.entityId;
    const registeredRef = useRef(false);

    // Register rigid body with physics binding system (legacy)
    useEffect(() => {
      if (rigidBodyRef.current && entityId !== undefined) {
        registerRigidBody(entityId, rigidBodyRef.current);

        return () => {
          unregisterRigidBody(entityId);
          colliderRegistry.unregister(entityId);
          registeredRef.current = false;
        };
      }
    }, [entityId]);

    // Register colliders after they're mounted (happens async after RigidBody creation)
    useFrame(() => {
      if (rigidBodyRef.current && entityId !== undefined && !registeredRef.current) {
        const numColliders = rigidBodyRef.current.numColliders();

        // Only register once colliders are present
        if (numColliders > 0) {
          const colliders: RapierCollider[] = [];
          for (let i = 0; i < numColliders; i++) {
            const collider = rigidBodyRef.current.collider(i);
            if (collider) {
              colliders.push(collider);
            }
          }

          const physicsRefs: IEntityPhysicsRefs = {
            rigidBody: rigidBodyRef.current,
            colliders,
          };
          colliderRegistry.register(entityId, physicsRefs);
          registeredRef.current = true;
        }
      }
    });

    if (!physicsContributions) {
      return <>{children}</>;
    }

    // Skip physics if heightfield config is invalid
    if (enhancedColliderConfig?.type === 'heightfield' && !enhancedColliderConfig?.terrain) {
      Logger.create('EntityPhysicsBody').warn(
        'Skipping physics for invalid heightfield configuration',
      );
      return <>{children}</>;
    }

    const { rigidBodyProps } = physicsContributions;

    try {
      return (
        <RigidBody
          ref={rigidBodyRef}
          key={terrainColliderKey}
          type={rigidBodyProps.type as any}
          mass={rigidBodyProps.mass}
          friction={rigidBodyProps.friction}
          restitution={rigidBodyProps.restitution}
          density={rigidBodyProps.density}
          gravityScale={rigidBodyProps.gravityScale}
          canSleep={rigidBodyProps.canSleep}
          position={position}
          rotation={rotationRadians}
          scale={scale}
          colliders={
            // Use false to disable auto-colliders and rely on custom colliders below
            enhancedColliderConfig?.type === 'heightfield'
              ? false
              : hasCustomColliders || hasEffectiveCustomColliders
                ? false
                : (colliderType as any)
          }
        >
          {/* Custom Colliders - now properly handling heightfield */}
          <EntityColliders colliderConfig={enhancedColliderConfig} />
          {children}
        </RigidBody>
      );
    } catch (error) {
      Logger.create('EntityPhysicsBody').error(
        'Failed to create physics body, falling back to non-physics:',
        error,
      );
      return <>{children}</>;
    }
  },
);

EntityPhysicsBody.displayName = 'EntityPhysicsBody';

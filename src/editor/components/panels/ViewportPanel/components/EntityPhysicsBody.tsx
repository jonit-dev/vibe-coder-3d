import React from 'react';
import { RigidBody } from '@react-three/rapier';
import type { IPhysicsContributions } from '../hooks/useEntityMesh';
import { EntityColliders } from './EntityColliders';
import { Logger } from '@/core/lib/logger';

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

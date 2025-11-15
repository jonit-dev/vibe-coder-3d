import { Logger } from '@/core/lib/logger';
import {
  registerRigidBody,
  unregisterRigidBody,
} from '@/core/lib/scripting/adapters/physics-binding';
import { colliderRegistry } from '@/core/physics/character/ColliderRegistry';
import type { IEntityPhysicsRefs } from '@/core/physics/character/types';
import type { Collider as RapierCollider } from '@dimforge/rapier3d-compat';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import React, { useEffect, useRef } from 'react';
import type { IPhysicsContributions } from '../hooks/useEntityMesh';
import { EntityColliders } from './EntityColliders';

interface IColliderSize {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  capsuleRadius?: number;
  capsuleHeight?: number;
}

interface IEntityPhysicsBodyProps {
  entityId: number;
  terrainColliderKey: string;
  physicsContributions?: IPhysicsContributions;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
  enhancedColliderConfig: {
    type: string;
    center: [number, number, number];
    isTrigger: boolean;
    size: IColliderSize;
    terrain?: {
      widthSegments: number;
      depthSegments: number;
      heights: number[];
      positions?: Float32Array;
      scale: { x: number; y: number; z: number };
    };
  } | null;
  hasCustomColliders: boolean;
  hasEffectiveCustomColliders: boolean;
  colliderType: string;
  children: React.ReactNode;
}

export const EntityPhysicsBody: React.FC<IEntityPhysicsBodyProps> = React.memo(
  ({
    entityId,
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
    const registeredRef = useRef(false);

    // Cleanup on unmount only - registration happens in useFrame
    useEffect(() => {
      return () => {
        Logger.create('EntityPhysicsBody').debug('Unmounting - cleaning up', {
          entityId,
          timestamp: Date.now(),
        });
        unregisterRigidBody(entityId);
        colliderRegistry.unregister(entityId);
        registeredRef.current = false;
      };
    }, [entityId]);

    // Register/update colliders in useFrame (after Rapier objects are created)
    // Also handles re-registration after registry is cleared (stop/replay scenario)
    useFrame(() => {
      if (!rigidBodyRef.current) return;

      try {
        // Register with legacy binding system (idempotent)
        registerRigidBody(entityId, rigidBodyRef.current);

        // Check if entity is still registered (it might have been cleared on stop)
        const isRegistered = colliderRegistry.hasPhysics(entityId);

        // Re-register if registry was cleared (e.g., on stop/replay)
        if (!isRegistered) {
          Logger.create('EntityPhysicsBody').debug('Re-registering after registry clear', {
            entityId,
            timestamp: Date.now(),
          });
          const physicsRefs: IEntityPhysicsRefs = {
            rigidBody: rigidBodyRef.current,
            colliders: [], // Will be updated below if colliders are ready
          };
          colliderRegistry.register(entityId, physicsRefs);
          registeredRef.current = false; // Force collider update
        }

        // Update colliders if not yet done
        if (!registeredRef.current) {
          // CRITICAL: numColliders() can throw if the rigid body was destroyed (e.g., on stop)
          // This happens because useFrame continues running after physics world is destroyed
          const numColliders = rigidBodyRef.current.numColliders();

          // Update registry once colliders are present
          if (numColliders > 0) {
            const colliders: RapierCollider[] = [];
            for (let i = 0; i < numColliders; i++) {
              const collider = rigidBodyRef.current.collider(i);
              if (collider) {
                colliders.push(collider);
              }
            }

            Logger.create('EntityPhysicsBody').info('Updating colliders in registry', {
              entityId,
              colliderCount: colliders.length,
              timestamp: Date.now(),
              registrationSource: 'useFrame',
            });

            const physicsRefs: IEntityPhysicsRefs = {
              rigidBody: rigidBodyRef.current,
              colliders,
            };
            colliderRegistry.register(entityId, physicsRefs); // Re-register with colliders
            registeredRef.current = true;
          }
        }
      } catch {
        // Silently ignore errors from destroyed rigid bodies (happens on stop/cleanup)
        // The cleanup in useEffect will handle proper unregistration
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
      // Map our type names to Rapier's type names
      const mapTypeToRapier = (type?: string): 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity' | undefined => {
        if (!type) return undefined;
        const lowerType = type.toLowerCase();
        if (lowerType === 'static') return 'fixed';
        if (lowerType === 'dynamic') return 'dynamic';
        if (lowerType === 'kinematic') return 'kinematicPosition';
        return 'dynamic'; // default fallback
      };

      // Extract known rigidBodyProps and preserve any additional Rapier props (callbacks, axis locks, etc.)
      const {
        type,
        mass,
        friction,
        restitution,
        density,
        gravityScale,
        canSleep,
        ...additionalRapierProps
      } = rigidBodyProps;

      return (
        <RigidBody
          ref={rigidBodyRef}
          key={terrainColliderKey}
          type={mapTypeToRapier(type)}
          mass={mass}
          friction={friction}
          restitution={restitution}
          density={density}
          gravityScale={gravityScale}
          canSleep={canSleep}
          position={position}
          rotation={rotationRadians}
          scale={scale}
          colliders={
            // Use false to disable auto-colliders and rely on custom colliders below
            enhancedColliderConfig?.type === 'heightfield'
              ? false
              : hasCustomColliders || hasEffectiveCustomColliders
                ? false
                : (colliderType as 'cuboid' | 'ball' | 'trimesh' | 'capsule' | 'heightfield' | false | undefined)
          }
          {...additionalRapierProps}
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

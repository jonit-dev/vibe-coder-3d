// PhysicsTrigger.tsx - A non-solid trigger zone that integrates with our ECS
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { ReactNode, useEffect, useRef } from 'react';

import { useECS } from '../../hooks/useECS';
import { Transform } from '../../lib/ecs';
import { registerPhysicsBody } from '../../systems/PhysicsSyncSystem';

// Props for the PhysicsTrigger component
export interface PhysicsTriggerProps {
  position?: [number, number, number];
  size?: [number, number, number]; // half-width, half-height, half-depth
  visible?: boolean;
  color?: string;
  opacity?: number;
  onEnter?: (entity: number) => void;
  onExit?: (entity: number) => void;
  children?: ReactNode;
}

/**
 * PhysicsTrigger - A non-solid trigger zone that integrates with our ECS
 */
export const PhysicsTrigger = ({
  position = [0, 0, 0],
  size = [1, 1, 1],
  visible = false,
  color = '#4d4dff',
  opacity = 0.2,
  onEnter,
  onExit,
  children,
}: PhysicsTriggerProps) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { createEntity } = useECS();

  // Entity reference
  const entityRef = useRef<number | null>(null);

  // Create ECS entity when mounted
  useEffect(() => {
    if (rigidBodyRef.current) {
      // Create an ECS entity
      const entity = createEntity();
      entityRef.current = entity;

      // Set initial transform values
      Transform.position[entity][0] = position[0];
      Transform.position[entity][1] = position[1];
      Transform.position[entity][2] = position[2];

      // Register the physics body with ECS
      registerPhysicsBody(entity, rigidBodyRef.current as any);
    }
  }, [createEntity, position]);

  // Handle collision events if provided
  const handleCollisionEnter = (payload: any) => {
    if (onEnter && payload.other.rigidBodyObject) {
      // Call the onEnter callback with the entity ID
      // In a real implementation, you'd get the actual entity ID
      onEnter(0);
    }
  };

  const handleCollisionExit = (payload: any) => {
    if (onExit && payload.other.rigidBodyObject) {
      // Call the onExit callback with the entity ID
      // In a real implementation, you'd get the actual entity ID
      onExit(0);
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="fixed"
      colliders={false}
      sensor
      onIntersectionEnter={handleCollisionEnter}
      onIntersectionExit={handleCollisionExit}
    >
      <CuboidCollider args={size} sensor />

      {/* Visualization if visible is true */}
      {visible && (
        <mesh>
          <boxGeometry args={[size[0] * 2, size[1] * 2, size[2] * 2]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
      )}

      {children}
    </RigidBody>
  );
};

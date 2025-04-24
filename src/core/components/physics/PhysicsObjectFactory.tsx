import { RapierRigidBody, RigidBody, RigidBodyAutoCollider } from '@react-three/rapier';
import { useRef } from 'react';

import { EntityMesh } from '@/core/components/EntityMesh';

export type PhysicsObjectType = 'box' | 'sphere' | 'cylinder' | 'pin';

export interface IPhysicsObjectFactoryProps {
  type: PhysicsObjectType;
  position: [number, number, number];
  rotation?: [number, number, number, number]; // Quaternion
  scale?: [number, number, number];
  mass?: number;
  friction?: number;
  restitution?: number;
  color?: string;
  dimensions?: number[];
  children?: React.ReactNode;
  onCreated?: (body: RapierRigidBody | null) => void;
}

/**
 * Factory component for creating common physics object types
 * Simplifies creating standard physics objects with common geometries
 */
const PhysicsObjectFactory = ({
  type,
  position,
  rotation = [0, 0, 0, 1],
  scale = [1, 1, 1],
  mass = 1,
  friction = 0.7,
  restitution = 0.2,
  color = '#ffffff',
  dimensions,
  children,
  onCreated,
}: IPhysicsObjectFactoryProps) => {
  const bodyRef = useRef<RapierRigidBody>(null);

  // Handle object creation callback
  if (bodyRef.current && onCreated) {
    onCreated(bodyRef.current);
  }

  // Render different geometries based on type
  const renderGeometry = () => {
    switch (type) {
      case 'box':
        return (
          <boxGeometry args={[dimensions?.[0] || 1, dimensions?.[1] || 1, dimensions?.[2] || 1]} />
        );

      case 'sphere':
        return (
          <sphereGeometry
            args={[dimensions?.[0] || 0.5, dimensions?.[1] || 32, dimensions?.[2] || 32]}
          />
        );

      case 'cylinder':
        return (
          <cylinderGeometry
            args={[
              dimensions?.[0] || 0.5, // top radius
              dimensions?.[1] || 0.5, // bottom radius
              dimensions?.[2] || 1, // height
              dimensions?.[3] || 16, // radial segments
            ]}
          />
        );

      case 'pin':
        // Specialized bowling pin shape
        return (
          <group scale={scale}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[1, 1.5, 1, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[1.5, 0.8, 1, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.8, 0.6, 1, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 3.3, 0]}>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );

      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  // Determine appropriate collider type
  const getColliderType = (): RigidBodyAutoCollider => {
    switch (type) {
      case 'box':
        return 'cuboid';
      case 'sphere':
        return 'ball';
      case 'cylinder':
      case 'pin':
        return 'hull';
      default:
        return 'cuboid';
    }
  };

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      type="dynamic"
      colliders={getColliderType()}
      mass={mass}
      friction={friction}
      restitution={restitution}
    >
      <EntityMesh castShadow receiveShadow rotation={rotation}>
        {children || (
          <>
            {renderGeometry()}
            {!children && <meshStandardMaterial color={color} />}
          </>
        )}
      </EntityMesh>
    </RigidBody>
  );
};

export default PhysicsObjectFactory;

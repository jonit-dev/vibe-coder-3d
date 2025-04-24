import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import { Quaternion, Vector3 } from 'three';

import { EntityMesh } from '@/core/components/EntityMesh';

const CYLINDER_COLLIDER = 'cuboid';

const BowlingPin = ({
  position,
  pinId,
  onFallen,
}: {
  position: [number, number, number];
  pinId: number;
  onFallen: (pinId: number, isFallen: boolean) => void;
}) => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [fallen, setFallen] = useState(false);

  useFrame(() => {
    if (bodyRef.current) {
      const rotation = bodyRef.current.rotation();
      const quat = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
      const up = new Vector3(0, 1, 0);
      const pinnedUp = new Vector3(0, 1, 0).applyQuaternion(quat);
      const angle = up.angleTo(pinnedUp) * (180 / Math.PI);
      if (angle > 45 && !fallen) {
        setFallen(true);
        onFallen(pinId, true);
      }
    }
  });

  // Get appropriate performance level based on pin ID
  // Pins closest to the camera (lower ID) get high performance
  // Pins further back can use lower performance settings
  const getPerformanceLevel = () => {
    // Pin 1 is closest to the camera, pin 10 is furthest
    if (pinId <= 3) return 'high';
    if (pinId <= 6) return 'medium';
    return 'low';
  };

  return (
    <group position={position}>
      <RigidBody
        ref={bodyRef}
        colliders={CYLINDER_COLLIDER}
        type="dynamic"
        friction={0.7}
        restitution={0.2}
        mass={1.2}
      >
        <EntityMesh
          performance={getPerformanceLevel()}
          frustumCulled={true}
          castShadow={true}
          receiveShadow={true}
        >
          <group scale={[0.12, 0.12, 0.12]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[1, 1.5, 1, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[1.5, 0.8, 1, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.8, 0.6, 1, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 3.3, 0]}>
              <sphereGeometry args={[0.8, 16, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 2.5, 0]}>
              <torusGeometry args={[0.8, 0.1, 16, 32]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <torusGeometry args={[1.5, 0.1, 16, 32]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
          </group>
        </EntityMesh>
      </RigidBody>
    </group>
  );
};

export default BowlingPin;

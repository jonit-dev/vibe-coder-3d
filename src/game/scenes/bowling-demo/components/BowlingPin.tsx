import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import { Quaternion, Vector3 } from 'three';

import { EntityMesh } from '@core/components/EntityMesh';
import { useTag } from '@core/hooks/useTag';

const CYLINDER_COLLIDER = 'cuboid';

// Define pin types for easier querying
export const PIN_TAGS = {
  ALL: 'bowling-pin',
  FALLEN: 'bowling-pin-fallen',
  STANDING: 'bowling-pin-standing',
  HEAD: 'bowling-pin-head', // Pin #1
  LEFT_CORNER: 'bowling-pin-left-corner', // Pin #7
  RIGHT_CORNER: 'bowling-pin-right-corner', // Pin #10
  ROW_FRONT: 'bowling-pin-row-front', // Pins 1-3
  ROW_MIDDLE: 'bowling-pin-row-middle', // Pins 4-6
  ROW_BACK: 'bowling-pin-row-back', // Pins 7-10
};

interface IBowlingPinProps {
  position: [number, number, number];
  pinId: number;
  onFallen: (pinId: number, isFallen: boolean) => void;
  color?: string;
  stripeColor?: string;
  scale?: number;
  mass?: number;
  friction?: number;
  restitution?: number;
  tags?: string[]; // Additional custom tags
}

const BowlingPin = ({
  position,
  pinId,
  onFallen,
  color = '#ffffff',
  stripeColor = '#ff0000',
  scale = 0.12,
  mass = 1.2,
  friction = 0.7,
  restitution = 0.2,
  tags = [],
}: IBowlingPinProps) => {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [fallen, setFallen] = useState(false);

  // Apply basic tag for all pins
  useTag(PIN_TAGS.ALL, bodyRef);

  // Apply row tags based on pin ID
  useTag(PIN_TAGS.ROW_FRONT, bodyRef, pinId <= 3);
  useTag(PIN_TAGS.ROW_MIDDLE, bodyRef, pinId >= 4 && pinId <= 6);
  useTag(PIN_TAGS.ROW_BACK, bodyRef, pinId >= 7);

  // Apply special position tags
  useTag(PIN_TAGS.HEAD, bodyRef, pinId === 1);
  useTag(PIN_TAGS.LEFT_CORNER, bodyRef, pinId === 7);
  useTag(PIN_TAGS.RIGHT_CORNER, bodyRef, pinId === 10);

  // Apply fallen/standing status tags - these will update
  useTag(PIN_TAGS.FALLEN, bodyRef, fallen);
  useTag(PIN_TAGS.STANDING, bodyRef, !fallen);

  // Apply any custom tags
  tags.forEach((tag) => useTag(tag, bodyRef));

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
        friction={friction}
        restitution={restitution}
        mass={mass}
      >
        <EntityMesh
          performance={getPerformanceLevel()}
          frustumCulled={true}
          castShadow={true}
          receiveShadow={true}
        >
          <group scale={[scale, scale, scale]}>
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
            <mesh position={[0, 2.5, 0]}>
              <torusGeometry args={[0.8, 0.1, 16, 32]} />
              <meshStandardMaterial color={stripeColor} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
              <torusGeometry args={[1.5, 0.1, 16, 32]} />
              <meshStandardMaterial color={stripeColor} />
            </mesh>
          </group>
        </EntityMesh>
      </RigidBody>
    </group>
  );
};

export default BowlingPin;

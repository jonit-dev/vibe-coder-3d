import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Vector3 } from 'three';

import { EntityMesh } from '@core/components/EntityMesh';
import { useTag } from '@core/hooks/useTag';

export const BALL_TAGS = {
  BALL: 'bowling-ball',
  THROWN: 'bowling-ball-thrown',
  IN_GUTTER: 'bowling-ball-in-gutter',
};

export interface IBowlingBallProps {
  position: [number, number, number];
  color?: string;
  radius?: number;
  mass?: number;
  friction?: number;
  restitution?: number;
  onThrow?: (velocity: Vector3) => void;
  onGutter?: () => void;
  onReset?: () => void;
  initialVelocity?: [number, number, number];
  isActive?: boolean;
}

export interface IBowlingBallRef {
  throwBall: (force: Vector3) => void;
  reset: () => void;
  rigidBody: RapierRigidBody | null;
}

const BowlingBall = forwardRef<IBowlingBallRef, IBowlingBallProps>(
  (
    {
      position,
      color = '#000000',
      radius = 0.3,
      mass = 7.5,
      friction = 0.8,
      restitution = 0.2,
      onThrow,
      onGutter,
      onReset,
      initialVelocity = [0, 0, 0],
      isActive = true,
    },
    ref,
  ) => {
    const bodyRef = useRef<RapierRigidBody>(null);
    const [thrown, setThrown] = useState(false);
    const [inGutter, setInGutter] = useState(false);
    const lastPositionRef = useRef<Vector3>(new Vector3(...position));
    const velocityRef = useRef<Vector3>(new Vector3(...initialVelocity));

    // Apply tags
    useTag(BALL_TAGS.BALL, bodyRef);
    useTag(BALL_TAGS.THROWN, bodyRef, thrown);
    useTag(BALL_TAGS.IN_GUTTER, bodyRef, inGutter);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      throwBall: (force: Vector3) => {
        if (!bodyRef.current || thrown) return;

        bodyRef.current.applyImpulse(force, true);
        setThrown(true);
        onThrow?.(force);
      },
      reset: () => {
        if (!bodyRef.current) return;

        bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
        bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        setThrown(false);
        setInGutter(false);
      },
      rigidBody: bodyRef.current,
    }));

    useFrame(() => {
      if (!bodyRef.current || !isActive) return;

      const currentPosition = bodyRef.current.translation();
      const position = new Vector3(currentPosition.x, currentPosition.y, currentPosition.z);

      // Calculate velocity by comparing current position with last position
      if (lastPositionRef.current) {
        const delta = position.clone().sub(lastPositionRef.current);
        velocityRef.current.lerp(delta.multiplyScalar(60), 0.2); // Smooth the velocity
      }

      lastPositionRef.current = position.clone();

      // Check if ball is in the gutter
      if (!inGutter && (position.x < -1.2 || position.x > 1.2) && position.z < -2) {
        setInGutter(true);
        onGutter?.();
      }

      // Reset if ball goes too far
      if (position.z < -30) {
        onReset?.();
      }
    });

    return (
      <RigidBody
        ref={bodyRef}
        position={position}
        colliders="ball"
        type="dynamic"
        mass={mass}
        friction={friction}
        restitution={restitution}
        linearDamping={0.2}
        angularDamping={0.2}
      >
        <EntityMesh performance="high" castShadow={true} receiveShadow={true}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
        </EntityMesh>
      </RigidBody>
    );
  },
);

export default BowlingBall;

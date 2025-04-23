import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

import { addVelocity } from '@/core';
import { Entity } from '@/core/components/Entity';
import { useInput } from '@/core/hooks/useInput';

/**
 * CharacterController - simple WASD + jump controller for an entity
 */
export const CharacterController: React.FC = () => {
  const entityRef = useRef<number | null>(null);
  const { isPressed } = useInput();
  const speed = 5;
  const jumpStrength = 8;

  useFrame(() => {
    if (entityRef.current !== null) {
      let vx = 0;
      let vz = 0;
      if (isPressed('moveForward')) vz -= speed;
      if (isPressed('moveBackward')) vz += speed;
      if (isPressed('moveLeft')) vx -= speed;
      if (isPressed('moveRight')) vx += speed;
      let vy = 0;
      if (isPressed('jump')) vy = jumpStrength;
      addVelocity(entityRef.current, {
        linear: [vx, vy, vz],
        linearDamping: 0.2,
      });
    }
  });

  return (
    <Entity
      position={[0, 2, 0]}
      onUpdate={(entityId) => {
        if (entityRef.current === null) {
          entityRef.current = entityId;
        }
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="#00aaff" />
      </mesh>
    </Entity>
  );
};

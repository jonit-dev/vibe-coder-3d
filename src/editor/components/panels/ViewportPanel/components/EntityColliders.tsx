import { BallCollider, CuboidCollider } from '@react-three/rapier';
import React from 'react';

interface IEntityCollidersProps {
  colliderConfig: {
    type: string;
    center: [number, number, number];
    isTrigger: boolean;
    size: any;
  } | null;
}

export const EntityColliders: React.FC<IEntityCollidersProps> = React.memo(({ colliderConfig }) => {
  if (!colliderConfig) return null;

  const { type, center, isTrigger, size } = colliderConfig;

  return (
    <>
      {type === 'box' && (
        <CuboidCollider
          args={[(size?.width ?? 1) / 2, (size?.height ?? 1) / 2, (size?.depth ?? 1) / 2]}
          position={center}
          sensor={isTrigger}
        />
      )}
      {type === 'sphere' && (
        <BallCollider args={[size?.radius ?? 0.5]} position={center} sensor={isTrigger} />
      )}
      {type === 'capsule' && (
        <CuboidCollider
          args={[
            size?.capsuleRadius ?? 0.5,
            (size?.capsuleHeight ?? 1) / 2,
            size?.capsuleRadius ?? 0.5,
          ]}
          position={center}
          sensor={isTrigger}
        />
      )}
      {(type === 'convex' || type === 'mesh') && (
        <CuboidCollider args={[0.5, 0.5, 0.5]} position={center} sensor={isTrigger} />
      )}
    </>
  );
});

EntityColliders.displayName = 'EntityColliders';

import { BallCollider, CuboidCollider, HeightfieldCollider } from '@react-three/rapier';
import React from 'react';

interface IColliderSize {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  capsuleRadius?: number;
  capsuleHeight?: number;
}

interface IEntityCollidersProps {
  colliderConfig: {
    type: string;
    center: [number, number, number];
    isTrigger: boolean;
    size: IColliderSize;
    // Optional terrain data for heightfield
    terrain?: {
      widthSegments: number;
      depthSegments: number;
      heights: number[];
      scale: { x: number; y: number; z: number };
    };
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
      {type === 'heightfield' && colliderConfig.terrain && (
        <HeightfieldCollider
          args={[
            colliderConfig.terrain.widthSegments,
            colliderConfig.terrain.depthSegments,
            colliderConfig.terrain.heights,
            colliderConfig.terrain.scale,
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

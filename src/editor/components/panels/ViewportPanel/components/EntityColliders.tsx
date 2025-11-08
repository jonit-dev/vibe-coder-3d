import { BallCollider, CapsuleCollider, CuboidCollider, TrimeshCollider } from '@react-three/rapier';
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
      positions?: Float32Array;
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
        <CapsuleCollider
          args={[(size?.capsuleHeight ?? 1) / 2, size?.capsuleRadius ?? 0.5]}
          position={center}
          sensor={isTrigger}
        />
      )}
      {type === 'heightfield' &&
        colliderConfig.terrain &&
        (() => {
          const rows = (colliderConfig.terrain.depthSegments ?? 0) + 1; // Z samples
          const cols = (colliderConfig.terrain.widthSegments ?? 0) + 1; // X samples
          const heights = colliderConfig.terrain.heights;
          const basePositions = colliderConfig.terrain.positions;

          const expected = rows * cols;
          const isValidHeights =
            Array.isArray(heights) &&
            heights.length === expected &&
            heights.every((h) => Number.isFinite(h));

          if (basePositions && isValidHeights) {
            const vertCount = expected;
            const vertices = new Float32Array(vertCount * 3);
            for (let i = 0; i < vertCount; i++) {
              vertices[i * 3 + 0] = basePositions[i * 3 + 0];
              vertices[i * 3 + 1] = (heights as number[])[i];
              vertices[i * 3 + 2] = basePositions[i * 3 + 2];
            }

            // Generate grid indices
            const quadW = cols - 1;
            const quadH = rows - 1;
            const triCount = quadW * quadH * 2;
            const indices = new Uint32Array(triCount * 3);
            let idx = 0;
            for (let r = 0; r < quadH; r++) {
              for (let c = 0; c < quadW; c++) {
                const i0 = r * cols + c;
                const i1 = i0 + 1;
                const i2 = i0 + cols;
                const i3 = i2 + 1;
                // two triangles (i0,i1,i2) and (i1,i3,i2)
                indices[idx++] = i0;
                indices[idx++] = i1;
                indices[idx++] = i2;
                indices[idx++] = i1;
                indices[idx++] = i3;
                indices[idx++] = i2;
              }
            }

            return (
              <TrimeshCollider args={[vertices, indices]} position={center} sensor={isTrigger} />
            );
          }

          // Fallback simple ground to avoid crash if positions missing
          const halfW = (size?.width ?? cols) / 2;
          const halfD = (size?.depth ?? rows) / 2;
          const halfH = Math.max(0.05, (size?.height ?? 0.1) / 2);
          return (
            <CuboidCollider args={[halfW, halfH, halfD]} position={center} sensor={isTrigger} />
          );
        })()}
      {(type === 'convex' || type === 'mesh') && (
        <CuboidCollider args={[0.5, 0.5, 0.5]} position={center} sensor={isTrigger} />
      )}
    </>
  );
});

EntityColliders.displayName = 'EntityColliders';

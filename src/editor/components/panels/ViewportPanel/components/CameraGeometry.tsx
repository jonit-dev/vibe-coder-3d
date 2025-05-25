import { Html } from '@react-three/drei';
import React, { useMemo } from 'react';
import { BsCameraReelsFill } from 'react-icons/bs';

export interface ICameraGeometryProps {
  size?: number;
  showFrustum?: boolean;
  isPlaying?: boolean;
  fov?: number;
  near?: number;
  far?: number;
  aspect?: number;
}

/**
 * Simple 2D camera icon using react-icons with dynamic frustum
 * Clean, flat design like modern game engines
 */
export const CameraGeometry: React.FC<ICameraGeometryProps> = ({
  size = 0.75,
  showFrustum = true,
  isPlaying = false,
  fov = 60,
  near = 0.3,
  far = 4.0,
  aspect = 16 / 9,
}) => {
  // Calculate frustum dimensions based on actual camera parameters
  const frustumVertices = useMemo(() => {
    // Calculate frustum dimensions using camera parameters
    const nearHeight = 2 * Math.tan((fov * Math.PI) / 360) * near;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan((fov * Math.PI) / 360) * far;
    const farWidth = farHeight * aspect;

    return new Float32Array([
      // Near plane (small rectangle)
      -nearWidth / 2,
      -nearHeight / 2,
      near,
      nearWidth / 2,
      -nearHeight / 2,
      near,
      nearWidth / 2,
      -nearHeight / 2,
      near,
      nearWidth / 2,
      nearHeight / 2,
      near,
      nearWidth / 2,
      nearHeight / 2,
      near,
      -nearWidth / 2,
      nearHeight / 2,
      near,
      -nearWidth / 2,
      nearHeight / 2,
      near,
      -nearWidth / 2,
      -nearHeight / 2,
      near,

      // Far plane (larger rectangle)
      -farWidth / 2,
      -farHeight / 2,
      far,
      farWidth / 2,
      -farHeight / 2,
      far,
      farWidth / 2,
      -farHeight / 2,
      far,
      farWidth / 2,
      farHeight / 2,
      far,
      farWidth / 2,
      farHeight / 2,
      far,
      -farWidth / 2,
      farHeight / 2,
      far,
      -farWidth / 2,
      farHeight / 2,
      far,
      -farWidth / 2,
      -farHeight / 2,
      far,

      // Connecting lines
      -nearWidth / 2,
      -nearHeight / 2,
      near,
      -farWidth / 2,
      -farHeight / 2,
      far,
      nearWidth / 2,
      -nearHeight / 2,
      near,
      farWidth / 2,
      -farHeight / 2,
      far,
      nearWidth / 2,
      nearHeight / 2,
      near,
      farWidth / 2,
      farHeight / 2,
      far,
      -nearWidth / 2,
      nearHeight / 2,
      near,
      -farWidth / 2,
      farHeight / 2,
      far,
    ]);
  }, [fov, near, far, aspect]);

  return (
    <group>
      {/* Simple white camera icon with transparent background - Hidden during play mode */}
      {!isPlaying && (
        <Html
          center
          distanceFactor={10}
          transform
          occlude={false}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <BsCameraReelsFill
            size={size * 32}
            color="#ffffff"
            style={{
              filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.8))',
            }}
          />
        </Html>
      )}

      {/* Camera Frustum - Only show in editor mode, not play mode */}
      {showFrustum && !isPlaying && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[frustumVertices, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </lineSegments>
      )}
    </group>
  );
};

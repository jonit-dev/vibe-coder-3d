import React from 'react';
import * as THREE from 'three';

export interface ICameraGeometryProps {
  size?: number;
  showFrustum?: boolean;
}

/**
 * Simple Unity-style camera icon - minimal wireframe design
 * Clean, geometric representation like Unity's scene view with proper frustum
 */
export const CameraGeometry: React.FC<ICameraGeometryProps> = ({
  size = 0.75,
  showFrustum = true,
}) => {
  // Create proper camera frustum geometry
  const frustumGeometry = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    // Define frustum parameters (like a real camera)
    const near = 0.3;
    const far = 4.0;
    const fov = 60; // field of view in degrees
    const aspect = 16 / 9;

    // Calculate frustum dimensions
    const nearHeight = 2 * Math.tan((fov * Math.PI) / 360) * near;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan((fov * Math.PI) / 360) * far;
    const farWidth = farHeight * aspect;

    // Define frustum vertices
    const vertices = new Float32Array([
      // Near plane rectangle (closer to camera)
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

      // Far plane rectangle (farther from camera)
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

      // Connecting lines from near to far plane
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

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }, []);

  return (
    <group>
      {/* Camera Body - Just wireframe outline */}
      <lineSegments position={[0, 0, 0]}>
        <edgesGeometry attach="geometry">
          <boxGeometry args={[size * 1.0, size * 0.6, size * 0.4]} />
        </edgesGeometry>
        <lineBasicMaterial attach="material" color="#ffffff" linewidth={2} />
      </lineSegments>

      {/* Lens - Simple wireframe circle */}
      <lineSegments position={[0, 0, size * 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <edgesGeometry attach="geometry">
          <cylinderGeometry args={[size * 0.15, size * 0.15, size * 0.1, 8]} />
        </edgesGeometry>
        <lineBasicMaterial attach="material" color="#ffffff" linewidth={2} />
      </lineSegments>

      {/* Camera Frustum - Proper wireframe showing field of view */}
      {showFrustum && (
        <lineSegments geometry={frustumGeometry}>
          <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.8} />
        </lineSegments>
      )}
    </group>
  );
};

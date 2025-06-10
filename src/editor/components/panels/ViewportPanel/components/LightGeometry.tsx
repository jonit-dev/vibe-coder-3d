import { Html } from '@react-three/drei';
import React, { useMemo } from 'react';
import { BsLightbulb, BsSun } from 'react-icons/bs';
import { MdFlare } from 'react-icons/md';

export interface ILightGeometryProps {
  lightType: 'directional' | 'point' | 'spot' | 'ambient';
  size?: number;
  showDirection?: boolean;
  isPlaying?: boolean;
  color?: { r: number; g: number; b: number };
  intensity?: number;
  range?: number;
  angle?: number;
}

/**
 * Light icon and visual representations for different light types
 * Similar to CameraGeometry but for lights
 */
export const LightGeometry: React.FC<ILightGeometryProps> = ({
  lightType,
  size = 0.75,
  showDirection = true,
  isPlaying = false,
  color = { r: 1, g: 1, b: 0.8 },
  intensity = 1.0,
  range = 10,
  angle = Math.PI / 6,
}) => {
  // Convert color to hex for icon tinting
  const lightColor = useMemo(() => {
    const r = Math.round(Math.min(255, color.r * 255 * intensity));
    const g = Math.round(Math.min(255, color.g * 255 * intensity));
    const b = Math.round(Math.min(255, color.b * 255 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }, [color, intensity]);

  // Choose icon based on light type
  const LightIcon = useMemo(() => {
    switch (lightType) {
      case 'directional':
        return BsSun;
      case 'point':
        return BsLightbulb;
      case 'spot':
        return BsLightbulb;
      case 'ambient':
        return MdFlare;
      default:
        return BsLightbulb;
    }
  }, [lightType]);

  // Create directional light ray geometry
  const directionalRays = useMemo(() => {
    if (lightType !== 'directional') return null;

    const rayLength = 2;
    return new Float32Array([
      // Main direction arrow (pointing down)
      0,
      0,
      0,
      0,
      -rayLength,
      0,

      // Side rays to show directionality
      -0.5,
      0,
      0,
      -0.5,
      -rayLength * 0.7,
      0,

      0.5,
      0,
      0,
      0.5,
      -rayLength * 0.7,
      0,

      0,
      0,
      -0.5,
      0,
      -rayLength * 0.7,
      -0.5,

      0,
      0,
      0.5,
      0,
      -rayLength * 0.7,
      0.5,
    ]);
  }, [lightType]);

  // Create point light range visualization
  const pointLightGeometry = useMemo(() => {
    if (lightType !== 'point') return null;

    const segments = 16;
    const vertices = [];

    // Create three circles for x, y, z planes to show sphere
    for (let plane = 0; plane < 3; plane++) {
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * range * 0.3; // Scale down for visibility
        const y = Math.sin(angle) * range * 0.3;

        if (plane === 0) {
          // XY plane
          vertices.push(x, y, 0);
        } else if (plane === 1) {
          // XZ plane
          vertices.push(x, 0, y);
        } else {
          // YZ plane
          vertices.push(0, x, y);
        }
      }
    }

    return new Float32Array(vertices);
  }, [lightType, range]);

  // Create spot light cone geometry
  const spotLightCone = useMemo(() => {
    if (lightType !== 'spot') return null;

    const coneLength = range * 0.3;
    const coneRadius = Math.tan(angle) * coneLength;
    const segments = 8;
    const vertices = [];

    // Cone outline
    for (let i = 0; i <= segments; i++) {
      const circleAngle = (i / segments) * Math.PI * 2;
      const x = Math.cos(circleAngle) * coneRadius;
      const y = Math.sin(circleAngle) * coneRadius;

      // From origin to cone edge
      vertices.push(0, 0, 0);
      vertices.push(x, y, -coneLength);

      // Cone circle
      if (i < segments) {
        const nextAngle = ((i + 1) / segments) * Math.PI * 2;
        const nextX = Math.cos(nextAngle) * coneRadius;
        const nextY = Math.sin(nextAngle) * coneRadius;

        vertices.push(x, y, -coneLength);
        vertices.push(nextX, nextY, -coneLength);
      }
    }

    return new Float32Array(vertices);
  }, [lightType, range, angle]);

  return (
    <group>
      {/* Light icon - Hidden during play mode */}
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
          <LightIcon
            size={size * 32}
            color={lightColor}
            style={{
              filter: `drop-shadow(0 0 4px ${lightColor})`,
            }}
          />
        </Html>
      )}

      {/* Light-specific visualizations - Only show in editor mode */}
      {showDirection && !isPlaying && (
        <>
          {/* Directional light rays */}
          {lightType === 'directional' && directionalRays && (
            <lineSegments raycast={() => null}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[directionalRays, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={lightColor} transparent opacity={0.6} />
            </lineSegments>
          )}

          {/* Point light range circles */}
          {lightType === 'point' && pointLightGeometry && (
            <lineLoop raycast={() => null}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[pointLightGeometry, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={lightColor} transparent opacity={0.4} />
            </lineLoop>
          )}

          {/* Spot light cone */}
          {lightType === 'spot' && spotLightCone && (
            <lineSegments raycast={() => null}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[spotLightCone, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={lightColor} transparent opacity={0.5} />
            </lineSegments>
          )}

          {/* Ambient light doesn't need direction visualization */}
        </>
      )}
    </group>
  );
};

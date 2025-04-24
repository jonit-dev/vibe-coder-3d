import { Physics } from '@react-three/rapier';
import { ReactNode } from 'react';

import { PhysicsSystem } from '@core/components/physics/PhysicsSystem';

interface ILightProps {
  ambientIntensity?: number;
  directionalLightProps?: {
    position?: [number, number, number];
    intensity?: number;
    castShadow?: boolean;
    shadowMapSize?: number;
    shadowCameraDistance?: number;
  };
  pointLights?: Array<{
    position: [number, number, number];
    intensity?: number;
    color?: string;
  }>;
}

interface IPhysicsWorldProps {
  children: ReactNode;
  gravity?: [number, number, number];
  lights?: ILightProps;
  interpolate?: boolean;
  maxSubSteps?: number;
  shadowQuality?: 'low' | 'medium' | 'high';
}

export const PhysicsWorld = ({
  children,
  gravity = [0, -9.81, 0],
  lights,
  interpolate = true,
  maxSubSteps = 5,
  shadowQuality = 'medium',
}: IPhysicsWorldProps) => {
  // Map shadow quality to actual shadow map size
  const shadowMapSizes = {
    low: 1024,
    medium: 1536,
    high: 2048,
  };

  const shadowMapSize = shadowMapSizes[shadowQuality];

  const {
    ambientIntensity = 0.4,
    directionalLightProps = {
      position: [2, 10, 5],
      intensity: 0.8,
      castShadow: true,
      shadowMapSize: shadowMapSize,
      shadowCameraDistance: 50,
    },
    pointLights = [],
  } = lights || {};

  // Default shadow camera distance if not provided
  const shadowDistance = directionalLightProps.shadowCameraDistance || 50;

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={ambientIntensity} />

      {directionalLightProps && (
        <directionalLight
          position={directionalLightProps.position}
          intensity={directionalLightProps.intensity}
          castShadow={directionalLightProps.castShadow}
          shadow-mapSize-width={directionalLightProps.shadowMapSize}
          shadow-mapSize-height={directionalLightProps.shadowMapSize}
          shadow-camera-far={shadowDistance}
          shadow-camera-left={-shadowDistance / 2.5}
          shadow-camera-right={shadowDistance / 2.5}
          shadow-camera-top={shadowDistance / 2.5}
          shadow-camera-bottom={-shadowDistance / 2.5}
        />
      )}

      {pointLights.map((light, index) => (
        <pointLight
          key={index}
          position={light.position}
          intensity={light.intensity || 0.5}
          color={light.color || '#ffffff'}
        />
      ))}

      {/* Physics system with proper props forwarding */}
      <Physics gravity={gravity} interpolate={interpolate} maxCcdSubsteps={maxSubSteps}>
        <PhysicsSystem>{children}</PhysicsSystem>
      </Physics>
    </>
  );
};

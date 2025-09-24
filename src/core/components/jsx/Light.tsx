/**
 * Light JSX Component - Maps React props to ECS Light component
 * Provides R3F-style lighting properties that sync with ECS system
 */

import React, { useEffect } from 'react';

import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import type { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';

import { useEntityContext } from './EntityContext';

export interface ILightProps {
  /** Light type */
  lightType?: 'directional' | 'point' | 'spot' | 'ambient';
  /** Light color */
  color?: { r: number; g: number; b: number };
  /** Light intensity */
  intensity?: number;
  /** Whether the light is enabled */
  enabled?: boolean;
  /** Whether the light casts shadows */
  castShadow?: boolean;
  /** Light range (for point/spot lights) */
  range?: number;
  /** Spot light angle in degrees */
  angle?: number;
  /** Spot light penumbra */
  penumbra?: number;
  /** Directional light direction */
  directionX?: number;
  directionY?: number;
  directionZ?: number;
  /** Shadow map size */
  shadowMapSize?: number;
  /** Shadow bias */
  shadowBias?: number;
  /** Shadow radius */
  shadowRadius?: number;
}

export const Light: React.FC<ILightProps> = ({
  lightType = 'directional',
  color = { r: 1.0, g: 1.0, b: 1.0 },
  intensity = 1.0,
  enabled = true,
  castShadow = false,
  range = 10,
  angle = 30,
  penumbra = 0,
  directionX = 0,
  directionY = -1,
  directionZ = 0,
  shadowMapSize = 1024,
  shadowBias = -0.0001,
  shadowRadius = 1.0,
}) => {
  const { entityId } = useEntityContext();

  useEffect(() => {
    const lightData: LightData = {
      lightType,
      color,
      intensity,
      enabled,
      castShadow,
      range,
      angle,
      penumbra,
      directionX,
      directionY,
      directionZ,
      shadowMapSize,
      shadowBias,
      shadowRadius,
    };

    if (componentRegistry.hasComponent(entityId, 'Light')) {
      // Update existing light
      componentRegistry.updateComponent(entityId, 'Light', lightData);
    } else {
      // Add new light component
      componentRegistry.addComponent(entityId, 'Light', lightData);
    }
  }, [
    entityId,
    lightType,
    color,
    intensity,
    enabled,
    castShadow,
    range,
    angle,
    penumbra,
    directionX,
    directionY,
    directionZ,
    shadowMapSize,
    shadowBias,
    shadowRadius,
  ]);

  // This component doesn't render anything - it just manages ECS data
  return null;
};

// Convenience components for specific light types
export const DirectionalLight: React.FC<Omit<ILightProps, 'lightType'>> = (props) => (
  <Light {...props} lightType="directional" />
);

export const PointLight: React.FC<Omit<ILightProps, 'lightType'>> = (props) => (
  <Light {...props} lightType="point" />
);

export const SpotLight: React.FC<Omit<ILightProps, 'lightType'>> = (props) => (
  <Light {...props} lightType="spot" />
);

export const AmbientLight: React.FC<Omit<ILightProps, 'lightType'>> = (props) => (
  <Light {...props} lightType="ambient" />
);

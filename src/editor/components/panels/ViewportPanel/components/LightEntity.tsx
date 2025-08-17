import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';

import { LightGeometry } from './LightGeometry';
import { isLightData, parseColorToRGB } from './utils';

interface ILightEntityProps {
  meshRef: React.RefObject<any>;
  entityId: number;
  entityComponents: any[];
  isPlaying: boolean;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}

export const LightEntity: React.FC<ILightEntityProps> = React.memo(
  ({ meshRef, entityId, entityComponents, isPlaying, onMeshClick }) => {
    // Extract light data for dynamic visualization
    const lightComponent = entityComponents.find((c) => c.type === 'Light');
    const lightData = lightComponent?.data;
    const typedLightData = isLightData(lightData) ? lightData : {};

    return (
      <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
        <LightGeometry
          lightType={typedLightData.lightType || 'point'}
          showDirection={true}
          isPlaying={isPlaying}
          color={parseColorToRGB(typedLightData.color)}
          intensity={typedLightData.intensity}
          range={typedLightData.range}
          angle={typedLightData.angle}
        />
      </group>
    );
  },
);

LightEntity.displayName = 'LightEntity';

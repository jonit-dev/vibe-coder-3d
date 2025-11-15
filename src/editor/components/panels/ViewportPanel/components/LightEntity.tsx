import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

import { LightGeometry } from './LightGeometry';
import { isLightData, parseColorToRGB } from './utils';

interface ILightEntityProps {
  meshInstanceRef: React.Ref<THREE.Object3D>;
  entityId: number;
  entityComponents: Array<{ type: string; data: unknown }>;
  isPlaying: boolean;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}

export const LightEntity: React.FC<ILightEntityProps> = React.memo(
  ({ meshInstanceRef, entityId, entityComponents, isPlaying, onMeshClick }) => {
    // Extract light data for dynamic visualization
    const lightComponent = entityComponents.find((c) => c.type === 'Light');
    const lightData = lightComponent?.data;
    const typedLightData = isLightData(lightData) ? lightData : {};

    return (
      <group ref={meshInstanceRef as React.Ref<THREE.Group>} userData={{ entityId }} onClick={onMeshClick}>
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

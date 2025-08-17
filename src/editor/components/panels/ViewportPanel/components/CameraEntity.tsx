import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';

import { CameraGeometry } from './CameraGeometry';
import { isCameraData } from './utils';

interface ICameraEntityProps {
  meshRef: React.RefObject<any>;
  entityId: number;
  entityComponents: any[];
  isPlaying: boolean;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}

export const CameraEntity: React.FC<ICameraEntityProps> = React.memo(
  ({ meshRef, entityId, entityComponents, isPlaying, onMeshClick }) => {
    // Extract camera data for dynamic frustum
    const cameraComponent = entityComponents.find((c) => c.type === 'Camera');
    const cameraData = cameraComponent?.data;
    const typedCameraData = isCameraData(cameraData) ? cameraData : {};

    return (
      <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
        <CameraGeometry
          showFrustum={true}
          isPlaying={isPlaying}
          fov={typedCameraData.fov}
          near={typedCameraData.near}
          far={typedCameraData.far}
          aspect={16 / 9} // TODO: Get actual viewport aspect ratio
        />
      </group>
    );
  },
);

CameraEntity.displayName = 'CameraEntity';

import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import * as THREE from 'three';

import { CameraGeometry } from './CameraGeometry';
import { isCameraData } from './utils';

interface ICameraEntityProps {
  meshInstanceRef: React.Ref<THREE.Object3D | THREE.Group | THREE.Mesh | null>;
  entityId: number;
  entityComponents: Array<{ type: string; data: unknown }>;
  isPlaying: boolean;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}

export const CameraEntity: React.FC<ICameraEntityProps> = React.memo(
  ({ meshInstanceRef, entityId, entityComponents, isPlaying, onMeshClick }) => {
    // Extract camera data for dynamic frustum
    const cameraComponent = entityComponents.find((c) => c.type === 'Camera');
    const cameraData = cameraComponent?.data;
    const typedCameraData = isCameraData(cameraData) ? cameraData : {};

    return (
      <group ref={meshInstanceRef} userData={{ entityId }} onClick={onMeshClick}>
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

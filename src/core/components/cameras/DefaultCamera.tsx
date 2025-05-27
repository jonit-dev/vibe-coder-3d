import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useRef } from 'react';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

import { ICameraData } from '@core/lib/ecs/components/CameraComponent';

export interface IDefaultCameraProps {
  cameraData: ICameraData;
  position?: [number, number, number];
  target?: [number, number, number];
}

/**
 * Unity-style Default Camera Component
 * Simplified to work with the cleaned up camera properties
 */
export const DefaultCamera: React.FC<IDefaultCameraProps> = ({
  cameraData,
  position = [0, 5, 10],
  target = [0, 0, 0],
}) => {
  const { set } = useThree();
  const cameraRef = useRef<PerspectiveCamera | OrthographicCamera | null>(null);

  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;

    // Apply camera properties based on projection type
    if (cameraData.projectionType === 'perspective' && camera instanceof PerspectiveCamera) {
      camera.fov = cameraData.fov;
      camera.near = cameraData.near;
      camera.far = cameraData.far;
      camera.updateProjectionMatrix();
    } else if (
      cameraData.projectionType === 'orthographic' &&
      camera instanceof OrthographicCamera
    ) {
      const size = cameraData.orthographicSize;
      const aspect = window.innerWidth / window.innerHeight;
      camera.left = -size * aspect;
      camera.right = size * aspect;
      camera.top = size;
      camera.bottom = -size;
      camera.near = cameraData.near;
      camera.far = cameraData.far;
      camera.updateProjectionMatrix();
    }

    // Set camera as the active camera
    set({ camera });
  }, [cameraData, set]);

  const targetVector = new Vector3(target[0], target[1], target[2]);

  if (cameraData.projectionType === 'perspective') {
    return (
      <>
        <perspectiveCamera
          ref={cameraRef as React.RefObject<PerspectiveCamera>}
          position={position}
          fov={cameraData.fov}
          near={cameraData.near}
          far={cameraData.far}
        />
        <OrbitControls target={targetVector} enableDamping dampingFactor={0.05} />
      </>
    );
  }

  return (
    <>
      <orthographicCamera
        ref={cameraRef as React.RefObject<OrthographicCamera>}
        position={position}
        left={-cameraData.orthographicSize}
        right={cameraData.orthographicSize}
        top={cameraData.orthographicSize}
        bottom={-cameraData.orthographicSize}
        near={cameraData.near}
        far={cameraData.far}
      />
      <OrbitControls target={targetVector} enableDamping dampingFactor={0.05} />
    </>
  );
};

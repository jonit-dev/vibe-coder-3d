import { useThree } from '@react-three/fiber';
import React, { useEffect } from 'react';
import * as THREE from 'three';

import { setEditorCamera } from '@/core/systems/cameraSystem';

/**
 * Component that connects the editor camera to the camera system
 * Must be used inside a Canvas context
 */
export const CameraSystemConnector: React.FC = React.memo(() => {
  const { camera } = useThree();

  // Connect the editor camera to the camera system
  useEffect(() => {
    setEditorCamera(camera as THREE.PerspectiveCamera | THREE.OrthographicCamera);

    return () => {
      setEditorCamera(null);
    };
  }, [camera]);

  // This component doesn't render anything
  return null;
});

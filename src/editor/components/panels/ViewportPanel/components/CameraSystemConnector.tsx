import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

import { setEditorCamera } from '@/core/systems/cameraSystem';

/**
 * Component that connects the editor camera to the camera system
 * Must be used inside a Canvas context
 */
export const CameraSystemConnector: React.FC = () => {
  const { camera } = useThree();

  // Connect the editor camera to the camera system
  useEffect(() => {
    setEditorCamera(camera as any);

    return () => {
      setEditorCamera(null);
    };
  }, [camera]);

  // This component doesn't render anything
  return null;
};

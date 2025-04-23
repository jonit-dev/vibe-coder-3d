import { useFrame, useThree } from '@react-three/fiber';
import { useState } from 'react';

// Tracks camera position in 3D scene and returns it via a hook
const useCameraPosition = () => {
  const [position, setPosition] = useState<[number, number, number]>([-21.56, 3.02, 17.68]);

  // Component to track camera position within Canvas
  const CameraTracker = () => {
    const { camera } = useThree();

    useFrame(() => {
      setPosition([camera.position.x, camera.position.y, camera.position.z] as [
        number,
        number,
        number,
      ]);
    });

    return null;
  };

  return { position, CameraTracker };
};

export default useCameraPosition;

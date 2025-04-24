import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

interface ICameraControllerProps {
  initialPosition?: [number, number, number];
  lookAt?: [number, number, number];
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
}

export const CameraController = ({
  initialPosition = [0, 3, -12],
  lookAt = [0, 0, 0],
  minDistance = 2,
  maxDistance = 20,
  minPolarAngle = 0.2,
  maxPolarAngle = Math.PI / 2.2,
  enableDamping = true,
  dampingFactor = 0.05,
}: ICameraControllerProps) => {
  const { camera } = useThree();

  // Set initial camera position and target
  useEffect(() => {
    camera.position.set(...initialPosition);
    camera.lookAt(...lookAt);
  }, [camera, initialPosition, lookAt]);

  return (
    <OrbitControls
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={minPolarAngle}
      maxPolarAngle={maxPolarAngle}
      target={lookAt}
      makeDefault
    />
  );
};

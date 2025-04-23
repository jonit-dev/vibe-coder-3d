import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ReactNode } from 'react';

interface SceneProps {
  children: ReactNode;
  controls?: boolean;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  background?: string;
}

export default function Scene({
  children,
  controls = true,
  cameraPosition = [0, 0, 5],
  cameraFov = 75,
  background = '#000000',
}: SceneProps) {
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: cameraFov }}
      style={{ background }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {children}
      {controls && <OrbitControls />}
    </Canvas>
  );
} 

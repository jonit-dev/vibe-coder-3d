import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface IModelLoadingPlaceholderProps {
  entityId: number;
  modelName?: string;
}

/**
 * A spinning wireframe box that appears while a custom model is being ingested and optimized.
 * Shows a visual loading indicator in the 3D scene.
 */
export const ModelLoadingPlaceholder: React.FC<IModelLoadingPlaceholderProps> = ({
  entityId,
  modelName,
}) => {
  const meshRef = useRef<Mesh>(null);

  // Rotate the box on all axes for a nice loading effect
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 1.5;
      meshRef.current.rotation.y += delta * 2.0;
      meshRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group userData={{ entityId }}>
      <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#4a9eff"
          wireframe
          opacity={0.8}
          transparent
          emissive="#4a9eff"
          emissiveIntensity={0.5}
        />
      </mesh>
      {modelName && (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}
    </group>
  );
};

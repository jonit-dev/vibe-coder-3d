import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface IModelLoadingMeshProps {
  meshRef?: React.RefObject<Mesh | null>;
  entityId: number;
  renderingContributions: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    visible?: boolean;
  };
  onMeshClick?: (e: any) => void;
  onMeshDoubleClick?: (e: any) => void;
}

export const ModelLoadingMesh: React.FC<IModelLoadingMeshProps> = React.memo(
  ({ meshRef, entityId, renderingContributions, onMeshClick, onMeshDoubleClick }) => {
    const loadingMeshRef = useRef<Mesh>(null);

    // Animate loading mesh with a gentle pulsing effect
    useFrame((state) => {
      if (loadingMeshRef.current) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        loadingMeshRef.current.scale.setScalar(pulse);
      }
    });

    return (
      <mesh
        ref={meshRef || loadingMeshRef}
        userData={{ entityId }}
        onClick={onMeshClick}
        onDoubleClick={onMeshDoubleClick}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        visible={renderingContributions.visible}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffd700" transparent opacity={0.7} wireframe />
      </mesh>
    );
  },
);

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh, Object3D, Group } from 'three';
import type { ThreeEvent } from '@react-three/fiber';

interface IModelLoadingMeshProps {
  meshRef?: React.RefObject<Group | Mesh | Object3D | null>;
  meshInstanceRef?: React.Ref<Group | Mesh | Object3D | null>;
  entityId: number;
  renderingContributions: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    visible?: boolean;
  };
  onMeshClick?: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export const ModelLoadingMesh: React.FC<IModelLoadingMeshProps> = React.memo(
  ({
    meshRef,
    meshInstanceRef,
    entityId,
    renderingContributions,
    onMeshClick,
    onMeshDoubleClick,
  }) => {
    const loadingMeshRef = useRef<Mesh>(null);

    // Animate loading mesh with a gentle pulsing effect
    useFrame((state) => {
      if (loadingMeshRef.current) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        loadingMeshRef.current.scale.setScalar(pulse);
      }
    });

    const resolvedRef =
      (meshInstanceRef as React.Ref<Group | Mesh | Object3D | null>) ||
      (meshRef as React.Ref<Group | Mesh | Object3D | null>) ||
      (loadingMeshRef as unknown as React.Ref<Group | Mesh | Object3D | null>);

    return (
      <mesh
        ref={resolvedRef}
        userData={{ entityId }}
        onClick={onMeshClick}
        onDoubleClick={onMeshDoubleClick}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        visible={renderingContributions.visible}
        frustumCulled={true}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffd700" transparent opacity={0.7} wireframe />
      </mesh>
    );
  },
);

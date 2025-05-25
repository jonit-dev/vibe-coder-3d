import React, { useMemo } from 'react';
import type { Mesh } from 'three';

import { CameraGeometry } from './CameraGeometry';

interface IEntityMeshProps {
  meshRef: React.RefObject<Mesh | null>;
  meshType: string;
  renderingContributions: any;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: any) => void;
}

export const EntityMesh: React.FC<IEntityMeshProps> = React.memo(
  ({ meshRef, meshType, renderingContributions, entityColor, entityId, onMeshClick }) => {
    // Memoized geometry/content selection based on mesh type
    const geometryContent = useMemo(() => {
      switch (meshType) {
        case 'Sphere':
          return <sphereGeometry args={[0.5, 32, 32]} />;
        case 'Cylinder':
          return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
        case 'Cone':
          return <coneGeometry args={[0.5, 1, 32]} />;
        case 'Torus':
          return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
        case 'Plane':
          return <planeGeometry args={[1, 1]} />;
        case 'Camera':
          return null; // Special case - uses CameraGeometry component
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType]);

    // Special handling for camera entities
    if (meshType === 'Camera') {
      return (
        <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
          <CameraGeometry showFrustum={true} />
        </group>
      );
    }

    return (
      <mesh
        ref={meshRef}
        castShadow={renderingContributions.castShadow}
        receiveShadow={renderingContributions.receiveShadow}
        userData={{ entityId }}
        visible={renderingContributions.visible}
        onClick={onMeshClick}
      >
        {geometryContent}
        <meshStandardMaterial
          color={renderingContributions.material?.color ?? entityColor}
          metalness={renderingContributions.material?.metalness ?? 0}
          roughness={renderingContributions.material?.roughness ?? 0.5}
          emissive={renderingContributions.material?.emissive ?? '#000000'}
          emissiveIntensity={renderingContributions.material?.emissiveIntensity ?? 0}
        />
      </mesh>
    );
  },
);

EntityMesh.displayName = 'EntityMesh';

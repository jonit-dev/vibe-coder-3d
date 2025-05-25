import { Edges } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface IEntityOutlineProps {
  selected: boolean;
  meshType: string;
  outlineGroupRef: React.RefObject<THREE.Group | null>;
  outlineMeshRef: React.RefObject<THREE.Mesh | null>;
}

export const EntityOutline: React.FC<IEntityOutlineProps> = React.memo(
  ({ selected, meshType, outlineGroupRef, outlineMeshRef }) => {
    // Memoized geometry for outline
    const geometry = useMemo(() => {
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
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType]);

    if (!selected) return null;

    return (
      <group ref={outlineGroupRef}>
        <mesh ref={outlineMeshRef}>
          {geometry}
          <meshBasicMaterial visible={false} />
          <Edges color="#ff6b35" lineWidth={2} />
        </mesh>
      </group>
    );
  },
);

EntityOutline.displayName = 'EntityOutline';

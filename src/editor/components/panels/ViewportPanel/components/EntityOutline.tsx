import { Edges } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

import { CameraGeometry } from './CameraGeometry';

interface IEntityOutlineProps {
  selected: boolean;
  meshType: string;
  outlineGroupRef: React.RefObject<THREE.Group | null>;
  outlineMeshRef: React.RefObject<THREE.Mesh | null>;
  isPlaying: boolean;
  entityComponents?: Array<{ type: string; data: any }>;
}

export const EntityOutline: React.FC<IEntityOutlineProps> = React.memo(
  ({ selected, meshType, outlineGroupRef, outlineMeshRef, isPlaying, entityComponents = [] }) => {
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
        case 'Camera':
          return null; // Special case - uses CameraGeometry component
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType]);

    // Don't render at all when not selected
    if (!selected) return null;

    // Render but make invisible when playing (so it can still follow the cube)
    const shouldBeVisible = !isPlaying;

    // Special handling for camera entities
    if (meshType === 'Camera') {
      return (
        <group ref={outlineGroupRef}>
          <group ref={outlineMeshRef as any} visible={shouldBeVisible}>
            <CameraGeometry showFrustum={false} isPlaying={isPlaying} />
            <Edges color="#ff6b35" lineWidth={2} />
          </group>
        </group>
      );
    }

    return (
      <group ref={outlineGroupRef}>
        <mesh ref={outlineMeshRef} visible={shouldBeVisible}>
          {geometry}
          <meshBasicMaterial visible={false} />
          <Edges color="#ff6b35" lineWidth={2} />
        </mesh>
      </group>
    );
  },
);

EntityOutline.displayName = 'EntityOutline';

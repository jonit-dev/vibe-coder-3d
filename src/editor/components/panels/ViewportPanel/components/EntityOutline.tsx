import { Edges } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

interface IEntityOutlineProps {
  selected: boolean;
  meshType: string | null;
  outlineGroupRef: React.RefObject<THREE.Group | null>;
  outlineMeshRef: React.RefObject<THREE.Mesh | null>;
  isPlaying: boolean;
  entityComponents?: Array<{ type: string; data: unknown }>;
}

export const EntityOutline: React.FC<IEntityOutlineProps> = React.memo(
  ({ selected, meshType, outlineGroupRef, outlineMeshRef, isPlaying, entityComponents = [] }) => {
    // Note: entityComponents is available for future use but currently unused
    void entityComponents;

    // Don't render at all when not selected or no mesh type
    if (!selected || !meshType) return null;

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

    // Render but make invisible when playing (so it can still follow the cube)
    const shouldBeVisible = !isPlaying;

    // Special handling for camera entities - no outline for cameras
    if (meshType === 'Camera') {
      return null; // Cameras don't need selection outlines
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

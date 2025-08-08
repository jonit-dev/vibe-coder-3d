import { Edges } from '@react-three/drei';
import React, { useMemo } from 'react';
import * as THREE from 'three';

import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

export interface IColliderVisualizationProps {
  meshCollider: IMeshColliderData | null;
  visible: boolean;
  terrainHeights?: number[];
  terrainSegments?: [number, number];
  terrainPositions?: Float32Array;
}

export const ColliderVisualization: React.FC<IColliderVisualizationProps> = React.memo(
  ({ meshCollider, visible, terrainHeights, terrainSegments, terrainPositions }) => {
    // Memoized wireframe color
    const wireframeColor = useMemo(
      () => (meshCollider?.isTrigger ? '#00ff00' : '#ffff00'), // Green for triggers, yellow for solid
      [meshCollider?.isTrigger],
    );

    // Memoized terrain geometry for heightfield colliders
    const terrainGeometry = useMemo(() => {
      if (!terrainHeights || !terrainSegments || !meshCollider || !terrainPositions) {
        return null;
      }

      const [sx, sz] = terrainSegments;
      const geometry = new THREE.PlaneGeometry(
        meshCollider.size.width,
        meshCollider.size.depth,
        sx - 1,
        sz - 1,
      );

      // Rotate to horizontal (XZ plane)
      geometry.rotateX(-Math.PI / 2);

      // Use the exact positions from TerrainGeometry with applied heights
      const positions = new Float32Array(terrainPositions);

      // Apply height data to Y coordinates
      for (let i = 0; i < terrainHeights.length && i < positions.length / 3; i++) {
        positions[i * 3 + 1] = terrainHeights[i]; // Y coordinate
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();

      return geometry;
    }, [
      terrainHeights,
      terrainSegments,
      terrainPositions,
      meshCollider?.size.width,
      meshCollider?.size.depth,
    ]);

    // Memoized collider shape
    const colliderShape = useMemo(() => {
      if (!meshCollider || !meshCollider.enabled || !visible) {
        return null;
      }

      switch (meshCollider.colliderType) {
        case 'box':
          return (
            <mesh position={meshCollider.center}>
              <boxGeometry
                args={[meshCollider.size.width, meshCollider.size.height, meshCollider.size.depth]}
              />
              <meshBasicMaterial visible={false} />
              <Edges color={wireframeColor} />
            </mesh>
          );

        case 'sphere':
          return (
            <mesh position={meshCollider.center}>
              <sphereGeometry args={[meshCollider.size.radius, 16, 16]} />
              <meshBasicMaterial visible={false} />
              <Edges color={wireframeColor} />
            </mesh>
          );

        case 'capsule':
          // Approximate capsule with cylinder + sphere caps
          return (
            <group position={meshCollider.center}>
              {/* Main cylinder body */}
              <mesh>
                <cylinderGeometry
                  args={[
                    meshCollider.size.capsuleRadius,
                    meshCollider.size.capsuleRadius,
                    meshCollider.size.capsuleHeight,
                    16,
                  ]}
                />
                <meshBasicMaterial visible={false} />
                <Edges color={wireframeColor} />
              </mesh>
              {/* Top sphere cap */}
              <mesh position={[0, meshCollider.size.capsuleHeight / 2, 0]}>
                <sphereGeometry args={[meshCollider.size.capsuleRadius, 12, 8]} />
                <meshBasicMaterial visible={false} />
                <Edges color={wireframeColor} />
              </mesh>
              {/* Bottom sphere cap */}
              <mesh position={[0, -meshCollider.size.capsuleHeight / 2, 0]}>
                <sphereGeometry args={[meshCollider.size.capsuleRadius, 12, 8]} />
                <meshBasicMaterial visible={false} />
                <Edges color={wireframeColor} />
              </mesh>
            </group>
          );

        case 'convex':
        case 'mesh':
          // For convex/mesh, show a simple bounding box with dashed lines
          return (
            <mesh position={meshCollider.center}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color={wireframeColor} wireframe transparent opacity={0.3} />
            </mesh>
          );

        case 'heightfield':
          // For heightfield, use pre-computed terrain geometry that follows the height data
          return terrainGeometry ? (
            <mesh position={meshCollider.center} geometry={terrainGeometry}>
              <meshBasicMaterial visible={false} />
              <Edges color={wireframeColor} />
            </mesh>
          ) : (
            // Fallback to flat plane if no height data
            <mesh position={meshCollider.center} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[meshCollider.size.width, meshCollider.size.depth, 8, 8]} />
              <meshBasicMaterial visible={false} />
              <Edges color={wireframeColor} />
            </mesh>
          );

        default:
          return null;
      }
    }, [meshCollider, visible, wireframeColor]);

    return <group>{colliderShape}</group>;
  },
);

ColliderVisualization.displayName = 'ColliderVisualization';

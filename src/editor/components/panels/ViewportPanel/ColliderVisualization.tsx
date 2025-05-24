import { Edges } from '@react-three/drei';
import React from 'react';

import { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';

export interface IColliderVisualizationProps {
  meshCollider: IMeshColliderData | null;
  visible: boolean;
}

export const ColliderVisualization: React.FC<IColliderVisualizationProps> = ({
  meshCollider,
  visible,
}) => {
  if (!meshCollider || !meshCollider.enabled || !visible) {
    return null;
  }

  const wireframeColor = meshCollider.isTrigger ? '#00ff00' : '#ffff00'; // Green for triggers, yellow for solid

  const renderColliderShape = () => {
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

      default:
        return null;
    }
  };

  return <group>{renderColliderShape()}</group>;
};

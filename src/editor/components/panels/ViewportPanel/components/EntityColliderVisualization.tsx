import React from 'react';
import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { ColliderVisualization } from '../ColliderVisualization';

interface IEntityColliderVisualizationProps {
  selected: boolean;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
  enhancedColliderConfig: any;
  meshCollider?: { data: IMeshColliderData } | null;
}

export const EntityColliderVisualization: React.FC<IEntityColliderVisualizationProps> = React.memo(
  ({ selected, position, rotationRadians, scale, enhancedColliderConfig, meshCollider }) => {
    if (!selected) {
      return null;
    }

    const colliderData = enhancedColliderConfig
      ? {
          enabled: true,
          colliderType: enhancedColliderConfig.type,
          isTrigger: enhancedColliderConfig.isTrigger,
          center: enhancedColliderConfig.center,
          size: enhancedColliderConfig.size,
          physicsMaterial: { friction: 0.7, restitution: 0.3, density: 1 },
        }
      : meshCollider?.data || null;

    const terrainHeights =
      enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
        ? enhancedColliderConfig.terrain.heights
        : undefined;

    const terrainSegments =
      enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
        ? [
            enhancedColliderConfig.terrain.widthSegments + 1,
            enhancedColliderConfig.terrain.depthSegments + 1,
          ] as [number, number]
        : undefined;

    const terrainPositions =
      enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
        ? enhancedColliderConfig.terrain.positions
        : undefined;

    return (
      <group position={position} rotation={rotationRadians} scale={scale}>
        <ColliderVisualization
          meshCollider={colliderData}
          visible={selected}
          terrainHeights={terrainHeights}
          terrainSegments={terrainSegments}
          terrainPositions={terrainPositions}
        />
      </group>
    );
  },
);

EntityColliderVisualization.displayName = 'EntityColliderVisualization';

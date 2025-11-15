import React from 'react';
import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { ColliderVisualization } from '../ColliderVisualization';

interface IEntityColliderVisualizationProps {
  selected: boolean;
  position: [number, number, number];
  rotationRadians: [number, number, number];
  scale: [number, number, number];
  enhancedColliderConfig: Record<string, unknown> | null;
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
          colliderType: enhancedColliderConfig.colliderType,
          isTrigger: enhancedColliderConfig.isTrigger,
          center: enhancedColliderConfig.center,
          size: enhancedColliderConfig.size,
          physicsMaterial: { friction: 0.7, restitution: 0.3, density: 1 },
        } as IMeshColliderData
      : meshCollider?.data || null;

    const terrainHeights =
      enhancedColliderConfig?.colliderType === 'heightfield' && enhancedColliderConfig.terrain
        ? (enhancedColliderConfig.terrain as { heights?: number[] }).heights
        : undefined;

    const terrainSegments =
      enhancedColliderConfig?.colliderType === 'heightfield' && enhancedColliderConfig.terrain
        ? [
            ((enhancedColliderConfig.terrain as { widthSegments?: number }).widthSegments ?? 0) + 1,
            ((enhancedColliderConfig.terrain as { depthSegments?: number }).depthSegments ?? 0) + 1,
          ] as [number, number]
        : undefined;

    const terrainPositions =
      enhancedColliderConfig?.colliderType === 'heightfield' && enhancedColliderConfig.terrain
        ? (enhancedColliderConfig.terrain as { positions?: Float32Array }).positions
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

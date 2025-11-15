import React from 'react';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { useTerrainPhysics } from './useTerrainPhysics';

interface IUseColliderConfigurationProps {
  entityId: number;
  isPlaying: boolean;
  colliderConfig: Record<string, unknown> | null;
  meshType: string | null;
  shouldHavePhysics: boolean;
  hasCustomColliders: boolean;
  terrainComponent?: { type: string; data: TerrainData };
}

export function useColliderConfiguration({
  entityId,
  isPlaying,
  colliderConfig,
  meshType,
  shouldHavePhysics,
  terrainComponent,
}: IUseColliderConfigurationProps) {
  const { terrainColliderKey, createTerrainColliderConfig, enhanceColliderWithTerrain } =
    useTerrainPhysics({
      entityId,
      isPlaying,
      terrainComponent,
    });

  const enhancedColliderConfig = React.useMemo(() => {
    // Handle terrain entities without MeshCollider component (auto-detect)
    if (!colliderConfig && meshType === 'Terrain' && shouldHavePhysics) {
      const terrainData = terrainComponent?.data;
      if (terrainData) {
        return createTerrainColliderConfig(terrainData);
      }
    }

    if (!colliderConfig || colliderConfig.type !== 'heightfield') {
      return colliderConfig;
    }

    // Get terrain data
    const terrainData = terrainComponent?.data;
    if (!terrainData) {
      return colliderConfig;
    }

    return enhanceColliderWithTerrain(colliderConfig, terrainData);
  }, [
    colliderConfig,
    terrainComponent,
    meshType,
    shouldHavePhysics,
    createTerrainColliderConfig,
    enhanceColliderWithTerrain,
  ]);

  const hasEffectiveCustomColliders = React.useMemo(
    () => Boolean(enhancedColliderConfig && enhancedColliderConfig.type !== 'heightfield'),
    [enhancedColliderConfig],
  );

  return {
    terrainColliderKey,
    enhancedColliderConfig,
    hasEffectiveCustomColliders,
  };
}

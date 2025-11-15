import React from 'react';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { useTerrainPhysics } from './useTerrainPhysics';

interface IColliderSize {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  capsuleRadius?: number;
  capsuleHeight?: number;
}

export interface IEnhancedColliderConfig {
  type: string;
  center: [number, number, number];
  isTrigger: boolean;
  size: IColliderSize;
  terrain?: {
    widthSegments: number;
    depthSegments: number;
    heights: number[];
    positions?: Float32Array;
    scale: { x: number; y: number; z: number };
  };
  [key: string]: unknown;
}

interface IUseColliderConfigurationProps {
  entityId: number;
  isPlaying: boolean;
  colliderConfig: Record<string, unknown> | null;
  meshType: string | null;
  shouldHavePhysics: boolean;
  hasCustomColliders: boolean;
  terrainComponent?: { type: string; data: TerrainData };
}

interface IUseColliderConfigurationReturn {
  terrainColliderKey: string;
  enhancedColliderConfig: IEnhancedColliderConfig | null;
  hasEffectiveCustomColliders: boolean;
}

function isEnhancedColliderConfig(config: unknown): config is IEnhancedColliderConfig {
  if (!config || typeof config !== 'object') return false;
  const cfg = config as Record<string, unknown>;
  return (
    typeof cfg.type === 'string' &&
    Array.isArray(cfg.center) &&
    cfg.center.length === 3 &&
    typeof cfg.isTrigger === 'boolean' &&
    typeof cfg.size === 'object' &&
    cfg.size !== null
  );
}

export function useColliderConfiguration({
  entityId,
  isPlaying,
  colliderConfig,
  meshType,
  shouldHavePhysics,
  terrainComponent,
}: IUseColliderConfigurationProps): IUseColliderConfigurationReturn {
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

    if (!colliderConfig || !isEnhancedColliderConfig(colliderConfig) || colliderConfig.type !== 'heightfield') {
      return isEnhancedColliderConfig(colliderConfig) ? colliderConfig : null;
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

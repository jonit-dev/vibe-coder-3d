import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { Logger } from '@/core/lib/logger';
import { generateTerrainHeights } from '@/core/lib/terrain/heightfieldGenerator';
import React from 'react';

interface IUseTerrainPhysicsProps {
  entityId: number;
  isPlaying: boolean;
  terrainComponent?: { type: string; data: TerrainData };
}

export function useTerrainPhysics({
  entityId,
  isPlaying,
  terrainComponent,
}: IUseTerrainPhysicsProps) {
  const logger = Logger.create('useTerrainPhysics');

  // Force-remount physics body when terrain SHAPE params change OR when physics stops
  // Include a generation counter that increments when transitioning from playing to stopped
  const [physicsGeneration, setPhysicsGeneration] = React.useState(0);

  React.useEffect(() => {
    // Only increment when transitioning from playing to not-playing (physics stop)
    if (!isPlaying) {
      setPhysicsGeneration((prev) => prev + 1);
    }
  }, [isPlaying]);

  const terrainColliderKey = React.useMemo(() => {
    const t = terrainComponent?.data;
    const baseKey = `rb-entity-${entityId}-gen-${physicsGeneration}`;
    if (!t) return baseKey;

    try {
      return `${baseKey}-terrain-${[
        ...(Array.isArray(t.size) ? t.size : []),
        ...(Array.isArray(t.segments) ? t.segments : []),
        t.heightScale,
        t.noiseEnabled,
        t.noiseSeed,
        t.noiseFrequency,
        t.noiseOctaves,
        t.noisePersistence,
        t.noiseLacunarity,
      ].join('|')}`;
    } catch {
      return baseKey;
    }
  }, [terrainComponent?.data, entityId, physicsGeneration]);

  const createTerrainColliderConfig = React.useCallback(
    (terrainData: TerrainData) => {
      try {
        logger.debug('Auto-creating heightfield collider for terrain without MeshCollider');

        const [w, d] = terrainData.size;
        const [sx, sz] = terrainData.segments;

        // Validate terrain data before generating heights
        if (!Array.isArray(terrainData.size) || terrainData.size.length !== 2) {
          logger.error('Invalid terrain size format:', terrainData.size);
          return null;
        }
        if (!Array.isArray(terrainData.segments) || terrainData.segments.length !== 2) {
          logger.error('Invalid terrain segments format:', terrainData.segments);
          return null;
        }

        const { heights, positions } = generateTerrainHeights(terrainData);

        // Defensive: ensure heights length matches segments grid (sx * sz)
        const expected = sx * sz;
        if (!Array.isArray(heights) || heights.length !== expected) {
          logger.error('Generated heights size mismatch for terrain', {
            expected,
            actual: Array.isArray(heights) ? heights.length : 'non-array',
            segments: [sx, sz],
          });
          return null;
        }

        // Use heights directly without column-major conversion
        // The original working implementation used heights as-is from generateTerrainHeights

        return {
          type: 'heightfield' as const,
          center: [0, 0, 0] as [number, number, number],
          isTrigger: false,
          size: { width: w, height: 1, depth: d },
          terrain: {
            widthSegments: sx - 1,
            depthSegments: sz - 1,
            heights, // Use heights directly without conversion
            positions,
            scale: { x: w / (sx - 1), y: 1, z: d / (sz - 1) },
          },
        };
      } catch (error) {
        logger.error('Failed to create terrain collider config:', error);
        return null;
      }
    },
    [logger],
  );

  const enhanceColliderWithTerrain = React.useCallback(
    (colliderConfig: any, terrainData: TerrainData) => {
      try {
        logger.debug('Processing heightfield collider for terrain');

        const [w, d] = terrainData.size;
        const [sx, sz] = terrainData.segments;

        // Validate terrain data
        if (!Array.isArray(terrainData.size) || terrainData.size.length !== 2) {
          logger.error('Invalid terrain size format for enhancement:', terrainData.size);
          return colliderConfig;
        }
        if (!Array.isArray(terrainData.segments) || terrainData.segments.length !== 2) {
          logger.error('Invalid terrain segments format for enhancement:', terrainData.segments);
          return colliderConfig;
        }

        const { heights, positions } = generateTerrainHeights(terrainData);

        // Defensive: ensure heights length matches segments grid (sx * sz)
        const expected = sx * sz;
        if (!Array.isArray(heights) || heights.length !== expected) {
          logger.error('Generated heights size mismatch during enhancement', {
            expected,
            actual: Array.isArray(heights) ? heights.length : 'non-array',
            segments: [sx, sz],
          });
          return colliderConfig;
        }

        // Use heights directly without column-major conversion

        return {
          ...colliderConfig,
          terrain: {
            widthSegments: sx - 1,
            depthSegments: sz - 1,
            heights, // Use heights directly without conversion
            positions,
            scale: { x: w / (sx - 1), y: 1, z: d / (sz - 1) },
          },
        };
      } catch (error) {
        logger.error('Failed to enhance collider with terrain data:', error);
        return colliderConfig;
      }
    },
    [logger],
  );

  return {
    terrainColliderKey,
    createTerrainColliderConfig,
    enhanceColliderWithTerrain,
  };
}

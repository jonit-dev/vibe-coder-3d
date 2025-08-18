import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';

import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { Logger } from '@/core/lib/logger';

interface IUseEntityTransformProps {
  transform: { data: ITransformData } | null | undefined;
  isTransforming: boolean;
  isPlaying: boolean;
}

export const useEntityTransform = ({
  transform,
  isTransforming,
  isPlaying,
}: IUseEntityTransformProps) => {
  const logger = Logger.create('EntityTransform');
  const meshRef = useRef<THREE.Group | THREE.Mesh | THREE.Object3D | null>(null);
  const lastSyncedTransform = useRef<string>('');

  // Extract transform data with defaults
  const transformData = useMemo(() => {
    if (!transform?.data) {
      return null; // Don't provide any transform data until it's properly loaded
    }
    return {
      position: transform.data.position || ([0, 0, 0] as [number, number, number]),
      rotation: transform.data.rotation || ([0, 0, 0] as [number, number, number]),
      scale: transform.data.scale || ([1, 1, 1] as [number, number, number]),
    };
  }, [transform?.data]);
  // Track meshRef stability
  const previousMeshRef = useRef<THREE.Group | THREE.Mesh | THREE.Object3D | null>(null);
  const renderCounter = useRef(0);
  renderCounter.current++;

  if (meshRef.current !== previousMeshRef.current) {
    logger.debug(`meshRef changed:`, {
      renderCount: renderCounter.current,
      oldRef: previousMeshRef.current,
      newRef: meshRef.current,
      newRefType: meshRef.current?.type,
      newRefConstructor: meshRef.current?.constructor.name,
      transformData,
      isTransforming,
      isPlaying,
    });
    previousMeshRef.current = meshRef.current;
  }

  // Convert rotation to radians for physics
  const rotationRadians = useMemo((): [number, number, number] | null => {
    if (!transformData) return null;
    return [
      transformData.rotation[0] * (Math.PI / 180),
      transformData.rotation[1] * (Math.PI / 180),
      transformData.rotation[2] * (Math.PI / 180),
    ];
  }, [transformData]);

  // Sync mesh transform from ComponentManager (single source of truth)
  // CRITICAL: Only sync when transform data actually changes, not on every render
  // Allow sync during play mode to handle position restoration on stop
  useEffect(() => {
    if (meshRef.current && !isTransforming && transformData) {
      const { position, rotation, scale } = transformData;

      // Create a more efficient hash using simple string concatenation
      const transformHash = `${position.join(',')},${rotation.join(',')},${scale.join(',')}`;

      logger.debug(`Transform sync attempt:`, {
        entityId: meshRef.current?.userData?.entityId,
        isTransforming,
        isPlaying,
        hasTransformData: !!transformData,
        transformHash,
        lastSyncedHash: lastSyncedTransform.current,
        meshRefType: meshRef.current?.type,
        meshRefConstructor: meshRef.current?.constructor.name,
        currentMeshPosition: [
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ],
        targetPosition: position,
        currentMeshRotation: [
          meshRef.current.rotation.x,
          meshRef.current.rotation.y,
          meshRef.current.rotation.z,
        ],
        targetRotation: rotation.map((r) => r * (Math.PI / 180)),
        currentMeshScale: [
          meshRef.current.scale.x,
          meshRef.current.scale.y,
          meshRef.current.scale.z,
        ],
        targetScale: scale,
      });

      // Only sync if the transform data actually changed AND the mesh position doesn't already match
      const meshPositionMatches =
        Math.abs(meshRef.current.position.x - position[0]) < 0.001 &&
        Math.abs(meshRef.current.position.y - position[1]) < 0.001 &&
        Math.abs(meshRef.current.position.z - position[2]) < 0.001;

      logger.debug(`DETAILED SYNC ANALYSIS:`, {
        entityId: meshRef.current?.userData?.entityId,
        transformHash,
        lastSyncedHash: lastSyncedTransform.current,
        transformHashChanged: lastSyncedTransform.current !== transformHash,
        meshPositionMatches,
        shouldSync: lastSyncedTransform.current !== transformHash && !meshPositionMatches,
        meshRefType: meshRef.current?.type,
        meshRefConstructor: meshRef.current?.constructor?.name,
        positionDeltas: [
          Math.abs(meshRef.current.position.x - position[0]),
          Math.abs(meshRef.current.position.y - position[1]),
          Math.abs(meshRef.current.position.z - position[2]),
        ],
        threshold: 0.001,
        meshRefChildren: meshRef.current?.children?.length || 0,
        meshRefFirstChildType: meshRef.current?.children?.[0]?.type || 'none',
      });

      // Always update tracking if transform hash changed
      if (lastSyncedTransform.current !== transformHash) {
        if (!meshPositionMatches) {
          // Apply transform if mesh position doesn't match ECS data
          logger.debug(`Applying transform sync - BEFORE:`, {
            entityId: meshRef.current?.userData?.entityId,
            beforePosition: [
              meshRef.current.position.x,
              meshRef.current.position.y,
              meshRef.current.position.z,
            ],
            beforeRotation: [
              meshRef.current.rotation.x,
              meshRef.current.rotation.y,
              meshRef.current.rotation.z,
            ],
            beforeScale: [
              meshRef.current.scale.x,
              meshRef.current.scale.y,
              meshRef.current.scale.z,
            ],
          });

          meshRef.current.position.set(position[0], position[1], position[2]);
          meshRef.current.rotation.set(
            rotation[0] * (Math.PI / 180),
            rotation[1] * (Math.PI / 180),
            rotation[2] * (Math.PI / 180),
          );
          meshRef.current.scale.set(scale[0], scale[1], scale[2]);

          // Force matrix updates to ensure changes propagate immediately
          meshRef.current.updateMatrix();
          meshRef.current.updateMatrixWorld(true);

          logger.debug(`Applying transform sync - AFTER:`, {
            entityId: meshRef.current?.userData?.entityId,
            afterPosition: [
              meshRef.current.position.x,
              meshRef.current.position.y,
              meshRef.current.position.z,
            ],
            afterRotation: [
              meshRef.current.rotation.x,
              meshRef.current.rotation.y,
              meshRef.current.rotation.z,
            ],
            afterScale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z],
            matrixAutoUpdate: meshRef.current.matrixAutoUpdate,
            matrixWorldNeedsUpdate: meshRef.current.matrixWorldNeedsUpdate,
          });
        } else {
          logger.debug(`Skipping sync - mesh already at correct position`, {
            entityId: meshRef.current?.userData?.entityId,
            meshPosition: [
              meshRef.current.position.x,
              meshRef.current.position.y,
              meshRef.current.position.z,
            ],
            targetPosition: position,
          });
        }

        // ALWAYS update the hash when transform data changes (this was the bug!)
        lastSyncedTransform.current = transformHash;
      } else {
        logger.debug(`Transform already synced, skipping update`);
      }
    } else {
      logger.debug(`Transform sync skipped:`, {
        entityId: meshRef.current?.userData?.entityId,
        hasMeshRef: !!meshRef.current,
        isTransforming,
        isPlaying,
        hasTransformData: !!transformData,
        reason: !meshRef.current
          ? 'No mesh ref'
          : isTransforming
            ? 'Currently transforming'
            : !transformData
              ? 'No transform data'
              : 'Unknown',
      });
    }
  }, [transformData, isTransforming]);

  // ADDITIONAL SYNC: Force sync when meshRef becomes available (important for custom models)
  useEffect(() => {
    if (meshRef.current && transformData && !isTransforming) {
      const { position, rotation, scale } = transformData;

      logger.debug(`Force sync on meshRef availability:`, {
        entityId: meshRef.current?.userData?.entityId,
        meshRefType: meshRef.current?.type,
        meshRefConstructor: meshRef.current?.constructor?.name,
        transformData,
        currentPosition: [
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ],
        targetPosition: position,
      });

      // Apply transform immediately when meshRef becomes available
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);

      // Force matrix updates
      meshRef.current.updateMatrix();
      meshRef.current.updateMatrixWorld(true);

      logger.debug(`Force sync completed:`, {
        entityId: meshRef.current?.userData?.entityId,
        newPosition: [
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ],
      });
    }
  }, [meshRef.current]); // Trigger when meshRef.current changes

  return {
    meshRef,
    position: transformData?.position || null,
    rotation: transformData?.rotation || null,
    scale: transformData?.scale || null,
    rotationRadians,
  };
};

import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';

import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

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
  const meshRef = useRef<THREE.Object3D | null>(null);
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
  const previousMeshRef = useRef<THREE.Object3D | null>(null);
  const renderCounter = useRef(0);
  renderCounter.current++;

  if (meshRef.current !== previousMeshRef.current) {
    console.log(`[useEntityTransform] meshRef changed:`, {
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
  useEffect(() => {
    if (meshRef.current && !isTransforming && !isPlaying && transformData) {
      const { position, rotation, scale } = transformData;

      // Create a more efficient hash using simple string concatenation
      const transformHash = `${position.join(',')},${rotation.join(',')},${scale.join(',')}`;

      console.log(`[useEntityTransform] Transform sync attempt:`, {
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

      if (lastSyncedTransform.current !== transformHash && !meshPositionMatches) {
        console.log(`[useEntityTransform] Applying transform sync - BEFORE:`, {
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
          beforeScale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z],
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

        console.log(`[useEntityTransform] Applying transform sync - AFTER:`, {
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

        lastSyncedTransform.current = transformHash;
      } else if (meshPositionMatches) {
        console.log(`[useEntityTransform] Skipping sync - mesh already at correct position`);
        lastSyncedTransform.current = transformHash;
      } else {
        console.log(`[useEntityTransform] Transform already synced, skipping update`);
      }
    } else {
      console.log(`[useEntityTransform] Transform sync skipped:`, {
        entityId: meshRef.current?.userData?.entityId,
        hasMeshRef: !!meshRef.current,
        isTransforming,
        isPlaying,
        hasTransformData: !!transformData,
        reason: !meshRef.current
          ? 'No mesh ref'
          : isTransforming
            ? 'Currently transforming'
            : isPlaying
              ? 'Playing mode'
              : !transformData
                ? 'No transform data'
                : 'Unknown',
      });
    }
  }, [transformData, isTransforming, isPlaying]);

  return {
    meshRef,
    position: transformData?.position || null,
    rotation: transformData?.rotation || null,
    scale: transformData?.scale || null,
    rotationRadians,
  };
};

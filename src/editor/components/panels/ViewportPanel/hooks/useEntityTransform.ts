import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';

interface IUseEntityTransformProps {
  transform: { data: ITransformData } | null | undefined;
  isTransforming: boolean;
  isPlaying: boolean;
}

export const useEntityTransform = ({ transform, isTransforming }: IUseEntityTransformProps) => {
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

      // Only sync if the transform data actually changed AND any of P/R/S differs
      const posMatches =
        Math.abs(meshRef.current.position.x - position[0]) < 0.001 &&
        Math.abs(meshRef.current.position.y - position[1]) < 0.001 &&
        Math.abs(meshRef.current.position.z - position[2]) < 0.001;

      // Mesh rotation is in radians; component data is in degrees
      const rotRadX = rotation[0] * (Math.PI / 180);
      const rotRadY = rotation[1] * (Math.PI / 180);
      const rotRadZ = rotation[2] * (Math.PI / 180);
      const rotMatches =
        Math.abs(meshRef.current.rotation.x - rotRadX) < 0.001 &&
        Math.abs(meshRef.current.rotation.y - rotRadY) < 0.001 &&
        Math.abs(meshRef.current.rotation.z - rotRadZ) < 0.001;

      const scaleMatches =
        Math.abs(meshRef.current.scale.x - scale[0]) < 0.001 &&
        Math.abs(meshRef.current.scale.y - scale[1]) < 0.001 &&
        Math.abs(meshRef.current.scale.z - scale[2]) < 0.001;

      // Always update tracking if transform hash changed
      if (lastSyncedTransform.current !== transformHash) {
        if (!(posMatches && rotMatches && scaleMatches)) {
          // Apply transform if any part doesn't match ECS data
          meshRef.current.position.set(position[0], position[1], position[2]);
          meshRef.current.rotation.set(rotRadX, rotRadY, rotRadZ);
          meshRef.current.scale.set(scale[0], scale[1], scale[2]);

          // Force matrix updates to ensure changes propagate immediately
          meshRef.current.updateMatrix();
          meshRef.current.updateMatrixWorld(true);
        }

        // ALWAYS update the hash when transform data changes
        lastSyncedTransform.current = transformHash;
      }
    }
  }, [transformData, isTransforming]);

  // ADDITIONAL SYNC: Force sync when meshRef becomes available (important for custom models)
  useEffect(() => {
    if (meshRef.current && transformData && !isTransforming) {
      const { position, rotation, scale } = transformData;

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

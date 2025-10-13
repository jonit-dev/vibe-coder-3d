import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
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

  const syncObjectTransform = useCallback(
    (object: THREE.Object3D | THREE.Group | THREE.Mesh | null, force = false) => {
      if (!object || !transformData || (!force && isTransforming)) {
        return;
      }

      const { position, rotation, scale } = transformData;

      // Mesh rotation is in radians; component data is in degrees
      const rotRadX = rotation[0] * (Math.PI / 180);
      const rotRadY = rotation[1] * (Math.PI / 180);
      const rotRadZ = rotation[2] * (Math.PI / 180);

      const posMatches =
        Math.abs(object.position.x - position[0]) < 0.001 &&
        Math.abs(object.position.y - position[1]) < 0.001 &&
        Math.abs(object.position.z - position[2]) < 0.001;

      const rotMatches =
        Math.abs(object.rotation.x - rotRadX) < 0.001 &&
        Math.abs(object.rotation.y - rotRadY) < 0.001 &&
        Math.abs(object.rotation.z - rotRadZ) < 0.001;

      const scaleMatches =
        Math.abs(object.scale.x - scale[0]) < 0.001 &&
        Math.abs(object.scale.y - scale[1]) < 0.001 &&
        Math.abs(object.scale.z - scale[2]) < 0.001;

      const transformHash = `${position.join(',')},${rotation.join(',')},${scale.join(',')}`;

      if (force || lastSyncedTransform.current !== transformHash || !(posMatches && rotMatches && scaleMatches)) {
        object.position.set(position[0], position[1], position[2]);
        object.rotation.set(rotRadX, rotRadY, rotRadZ);
        object.scale.set(scale[0], scale[1], scale[2]);

        object.updateMatrix();
        object.updateMatrixWorld(true);

        lastSyncedTransform.current = transformHash;
      }
    },
    [transformData, isTransforming],
  );

  // Sync mesh transform from ComponentManager (single source of truth)
  // CRITICAL: Only sync when transform data actually changes, not on every render
  // Allow sync during play mode to handle position restoration on stop
  useLayoutEffect(() => {
    if (meshRef.current) {
      syncObjectTransform(meshRef.current);
    }
  }, [syncObjectTransform]);

  const meshInstanceRef = useCallback(
    (object: THREE.Object3D | THREE.Group | THREE.Mesh | null) => {
      meshRef.current = object;

      if (!object) {
        lastSyncedTransform.current = '';
        return;
      }

      syncObjectTransform(object, true);
    },
    [syncObjectTransform],
  );

  return {
    meshRef,
    meshInstanceRef,
    position: transformData?.position || null,
    rotation: transformData?.rotation || null,
    scale: transformData?.scale || null,
    rotationRadians,
  };
};

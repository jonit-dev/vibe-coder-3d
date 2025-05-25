import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';

import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';

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
  const meshRef = useRef<Mesh | null>(null);

  // Extract transform data with defaults
  const transformData = useMemo(() => {
    if (!transform?.data) {
      return {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      };
    }

    return {
      position: transform.data.position || ([0, 0, 0] as [number, number, number]),
      rotation: transform.data.rotation || ([0, 0, 0] as [number, number, number]),
      scale: transform.data.scale || ([1, 1, 1] as [number, number, number]),
    };
  }, [transform?.data]);

  // Convert rotation to radians for physics
  const rotationRadians = useMemo(
    (): [number, number, number] => [
      transformData.rotation[0] * (Math.PI / 180),
      transformData.rotation[1] * (Math.PI / 180),
      transformData.rotation[2] * (Math.PI / 180),
    ],
    [transformData.rotation],
  );

  // Sync mesh transform from ComponentManager (single source of truth)
  useEffect(() => {
    if (meshRef.current && !isTransforming && !isPlaying) {
      const { position, rotation, scale } = transformData;

      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  }, [transformData, isTransforming, isPlaying]);

  return {
    meshRef,
    position: transformData.position,
    rotation: transformData.rotation,
    scale: transformData.scale,
    rotationRadians,
  };
};

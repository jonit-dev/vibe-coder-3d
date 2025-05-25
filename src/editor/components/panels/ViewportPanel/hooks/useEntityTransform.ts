import { useEffect, useMemo, useRef } from 'react';
import { Mesh } from 'three';

import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';
import { ITransformData } from '@/editor/lib/ecs/components/TransformComponent';

export interface IUseEntityTransformProps {
  entityId: number;
  isTransformingLocal: boolean;
  isPlaying: boolean;
}

export const useEntityTransform = ({
  entityId,
  isTransformingLocal,
  isPlaying,
}: IUseEntityTransformProps) => {
  const componentManager = useComponentManager();
  const meshRef = useRef<Mesh>(null);

  // Get transform component data
  const transform = componentManager.getComponent<ITransformData>(
    entityId,
    KnownComponentTypes.TRANSFORM,
  );

  // Extract transform values with defaults
  const position: [number, number, number] = transform?.data?.position || [0, 0, 0];
  const rotation: [number, number, number] = transform?.data?.rotation || [0, 0, 0];
  const scale: [number, number, number] = transform?.data?.scale || [1, 1, 1];

  // Convert rotation to radians for Three.js
  const rotationRadians = useMemo(
    (): [number, number, number] => [
      rotation[0] * (Math.PI / 180),
      rotation[1] * (Math.PI / 180),
      rotation[2] * (Math.PI / 180),
    ],
    [rotation],
  );

  // Sync mesh transform from ComponentManager (single source of truth)
  useEffect(() => {
    if (meshRef.current && !isTransformingLocal && !isPlaying) {
      // Only sync when NOT transforming and NOT in physics mode
      meshRef.current.position.set(position[0], position[1], position[2]);
      meshRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180),
      );
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  }, [position, rotation, scale, isTransformingLocal, isPlaying]);

  return {
    meshRef,
    transform,
    position,
    rotation,
    scale,
    rotationRadians,
  };
};

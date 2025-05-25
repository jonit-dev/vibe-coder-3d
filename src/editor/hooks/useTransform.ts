// Updated useTransform hook - now uses the new reactive ECS system
import { useCallback, useEffect, useState } from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';

import { useComponentManager } from './useComponentManager';

export interface IUseTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}

export const useTransform = (entityId: number | null): IUseTransform => {
  const componentManager = useComponentManager();
  const [position, setPositionState] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotationState] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScaleState] = useState<[number, number, number]>([1, 1, 1]);

  // Load transform data when entity changes
  useEffect(() => {
    if (entityId === null) {
      setPositionState([0, 0, 0]);
      setRotationState([0, 0, 0]);
      setScaleState([1, 1, 1]);
      return;
    }

    const transformComponent = componentManager.getTransformComponent(entityId);
    if (transformComponent?.data) {
      const data = transformComponent.data;
      setPositionState(data.position || [0, 0, 0]);
      setRotationState(data.rotation || [0, 0, 0]);
      setScaleState(data.scale || [1, 1, 1]);
    }
  }, [entityId, componentManager]);

  const setPosition = useCallback(
    (newPosition: [number, number, number]) => {
      if (entityId === null) return;
      setPositionState(newPosition);
      componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        position: newPosition,
      });
    },
    [entityId, componentManager],
  );

  const setRotation = useCallback(
    (newRotation: [number, number, number]) => {
      if (entityId === null) return;
      setRotationState(newRotation);
      componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        rotation: newRotation,
      });
    },
    [entityId, componentManager],
  );

  const setScale = useCallback(
    (newScale: [number, number, number]) => {
      if (entityId === null) return;
      setScaleState(newScale);
      componentManager.updateComponent(entityId, KnownComponentTypes.TRANSFORM, {
        scale: newScale,
      });
    },
    [entityId, componentManager],
  );

  return {
    position,
    rotation,
    scale,
    setPosition,
    setRotation,
    setScale,
  };
};

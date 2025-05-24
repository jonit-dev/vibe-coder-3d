// Updated useTransform hook - now uses the new reactive ECS system
import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';

export interface IUseTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}

export const useTransform = (selectedEntity: number | null): IUseTransform => {
  const [position, setPositionState] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotationState] = useState<[number, number, number]>([0, 0, 0]);
  const [scale, setScaleState] = useState<[number, number, number]>([1, 1, 1]);

  useEffect(() => {
    if (selectedEntity == null) {
      setPositionState([0, 0, 0]);
      setRotationState([0, 0, 0]);
      setScaleState([1, 1, 1]);
      return;
    }

    const updateTransform = () => {
      const transformData = componentManager.getComponentData(selectedEntity, 'transform');
      if (transformData) {
        setPositionState(transformData.position || [0, 0, 0]);
        setRotationState(transformData.rotation || [0, 0, 0]);
        setScaleState(transformData.scale || [1, 1, 1]);
      } else {
        setPositionState([0, 0, 0]);
        setRotationState([0, 0, 0]);
        setScaleState([1, 1, 1]);
      }
    };

    // Initial load
    updateTransform();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === selectedEntity && event.componentId === 'transform') {
        updateTransform();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [selectedEntity]);

  const setPosition = useCallback(
    async (next: [number, number, number]) => {
      if (selectedEntity == null) return;

      const result = await componentManager.updateComponent(selectedEntity, 'transform', {
        position: next,
        rotation,
        scale,
        needsUpdate: 1,
      });

      if (result.valid) {
        setPositionState(next);
      } else {
        console.warn('[useTransform] Failed to update position:', result.errors);
      }
    },
    [selectedEntity, rotation, scale],
  );

  const setRotation = useCallback(
    async (next: [number, number, number]) => {
      if (selectedEntity == null) return;

      const result = await componentManager.updateComponent(selectedEntity, 'transform', {
        position,
        rotation: next,
        scale,
        needsUpdate: 1,
      });

      if (result.valid) {
        setRotationState(next);
      } else {
        console.warn('[useTransform] Failed to update rotation:', result.errors);
      }
    },
    [selectedEntity, position, scale],
  );

  const setScale = useCallback(
    async (next: [number, number, number]) => {
      if (selectedEntity == null) return;

      const result = await componentManager.updateComponent(selectedEntity, 'transform', {
        position,
        rotation,
        scale: next,
        needsUpdate: 1,
      });

      if (result.valid) {
        setScaleState(next);
      } else {
        console.warn('[useTransform] Failed to update scale:', result.errors);
      }
    },
    [selectedEntity, position, rotation],
  );

  return { position, rotation, scale, setPosition, setRotation, setScale };
};

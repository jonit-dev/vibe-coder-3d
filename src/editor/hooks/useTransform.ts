import { useCallback, useState } from 'react';

import { Transform, incrementWorldVersion } from '@core/lib/ecs';
import { transformSystem } from '@core/systems/transformSystem';

export interface IUseTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  setPosition: (next: [number, number, number]) => void;
  setRotation: (next: [number, number, number]) => void;
  setScale: (next: [number, number, number]) => void;
}

export const useTransform = (selectedEntity: number | null): IUseTransform => {
  const getVec3 = (arr: Float32Array | undefined): [number, number, number] =>
    arr && arr.length >= 3 ? [arr[0], arr[1], arr[2]] : [0, 0, 0];

  const [position, setPositionState] = useState<[number, number, number]>(
    selectedEntity != null ? getVec3(Transform.position[selectedEntity]) : [0, 0, 0],
  );
  const [rotation, setRotationState] = useState<[number, number, number]>(
    selectedEntity != null ? getVec3(Transform.rotation[selectedEntity]) : [0, 0, 0],
  );
  const [scale, setScaleState] = useState<[number, number, number]>(
    selectedEntity != null ? getVec3(Transform.scale[selectedEntity]) : [1, 1, 1],
  );

  const setPosition = useCallback(
    (next: [number, number, number]) => {
      if (selectedEntity == null) return;
      Transform.position[selectedEntity][0] = next[0];
      Transform.position[selectedEntity][1] = next[1];
      Transform.position[selectedEntity][2] = next[2];
      Transform.needsUpdate[selectedEntity] = 1;
      incrementWorldVersion();
      setPositionState(next);
    },
    [selectedEntity],
  );

  const setRotation = useCallback(
    (next: [number, number, number]) => {
      if (selectedEntity == null) return;
      Transform.rotation[selectedEntity][0] = next[0];
      Transform.rotation[selectedEntity][1] = next[1];
      Transform.rotation[selectedEntity][2] = next[2];
      Transform.needsUpdate[selectedEntity] = 1;
      incrementWorldVersion();
      setRotationState(next);
    },
    [selectedEntity],
  );

  const setScale = useCallback(
    (next: [number, number, number]) => {
      if (selectedEntity == null) return;
      Transform.scale[selectedEntity][0] = next[0];
      Transform.scale[selectedEntity][1] = next[1];
      Transform.scale[selectedEntity][2] = next[2];
      Transform.needsUpdate[selectedEntity] = 1;
      incrementWorldVersion();
      setScaleState(next);
      transformSystem();
    },
    [selectedEntity],
  );

  return { position, rotation, scale, setPosition, setRotation, setScale };
};

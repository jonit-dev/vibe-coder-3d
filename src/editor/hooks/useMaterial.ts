import { useCallback, useEffect, useState } from 'react';

import { getEntityColor, setEntityColor } from '@/core/lib/ecs';

export interface IUseMaterial {
  color: string;
  setColor: (color: string) => void;
}

export const useMaterial = (selectedEntity: number | null): IUseMaterial => {
  const [color, setColorState] = useState<string>('#3399ff');

  useEffect(() => {
    if (selectedEntity == null) {
      setColorState('#3399ff');
      return;
    }
    setColorState(getEntityColor(selectedEntity));
  }, [selectedEntity]);

  const setColor = useCallback(
    (newColor: string) => {
      if (selectedEntity == null) return;
      setEntityColor(selectedEntity, newColor);
      setColorState(newColor);
    },
    [selectedEntity],
  );

  return { color, setColor };
};

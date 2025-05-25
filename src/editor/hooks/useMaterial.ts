import { useCallback, useEffect, useState } from 'react';

import { useComponentManager } from '@/editor/hooks/useComponentManager';

export interface IUseMaterial {
  color: string;
  setColor: (color: string) => void;
}

export const useMaterial = (selectedEntity: number | null): IUseMaterial => {
  const [color, setColorState] = useState<string>('#3399ff');
  const componentManager = useComponentManager();

  useEffect(() => {
    if (selectedEntity == null) {
      setColorState('#3399ff');
      return;
    }

    const updateColor = () => {
      const materialData = componentManager.getComponent(selectedEntity, 'material');
      if (
        materialData?.data &&
        typeof materialData.data === 'object' &&
        materialData.data !== null
      ) {
        // Convert RGB array to hex color if it's an array
        const colorValue = (materialData.data as any).color;
        if (Array.isArray(colorValue)) {
          const [r, g, b] = colorValue;
          const hex = `#${Math.round(r * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(g * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(b * 255)
            .toString(16)
            .padStart(2, '0')}`;
          setColorState(hex);
        } else if (typeof colorValue === 'string') {
          setColorState(colorValue);
        }
      } else {
        setColorState('#3399ff'); // Default blue
      }
    };

    // Initial load
    updateColor();

    // For now, poll for changes since we don't have an event system yet
    const interval = setInterval(updateColor, 100);

    return () => {
      clearInterval(interval);
    };
  }, [selectedEntity, componentManager]);

  const setColor = useCallback(
    (newColor: string) => {
      if (selectedEntity == null) return;

      // Convert hex color to RGB array
      const hex = newColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Update through ComponentManager
      const currentMaterial = componentManager.getComponent(selectedEntity, 'material');
      const materialData = currentMaterial?.data || {};

      const updatedMaterial = {
        ...materialData,
        color: [r, g, b],
      };

      if (currentMaterial) {
        componentManager.updateComponent(selectedEntity, 'material', updatedMaterial);
      } else {
        componentManager.addComponent(selectedEntity, 'material', updatedMaterial);
      }

      setColorState(newColor);
    },
    [selectedEntity, componentManager],
  );

  return { color, setColor };
};

import { useCallback, useEffect, useState } from 'react';

import { componentManager } from '@/core/dynamic-components/init';

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

    const updateColor = () => {
      const materialData = componentManager.getComponentData(selectedEntity, 'material');
      if (materialData?.color) {
        // Convert RGB array to hex color
        const [r, g, b] = materialData.color;
        const hex = `#${Math.round(r * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(g * 255)
          .toString(16)
          .padStart(2, '0')}${Math.round(b * 255)
          .toString(16)
          .padStart(2, '0')}`;
        setColorState(hex);
      } else {
        setColorState('#3399ff'); // Default blue
      }
    };

    // Initial load
    updateColor();

    // Listen for component changes
    const handleComponentChange = (event: any) => {
      if (event.entityId === selectedEntity && event.componentId === 'material') {
        updateColor();
      }
    };

    componentManager.addEventListener(handleComponentChange);

    return () => {
      componentManager.removeEventListener(handleComponentChange);
    };
  }, [selectedEntity]);

  const setColor = useCallback(
    async (newColor: string) => {
      if (selectedEntity == null) return;

      // Convert hex color to RGB array
      const hex = newColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      const result = await componentManager.updateComponent(selectedEntity, 'material', {
        color: [r, g, b],
        needsUpdate: 1,
      });

      if (result.valid) {
        setColorState(newColor);
      } else {
        console.warn('[useMaterial] Failed to update material color:', result.errors);
      }
    },
    [selectedEntity],
  );

  return { color, setColor };
};

import { useEffect } from 'react';
import { InputManager } from '@core/lib/input/InputManager';
import { useCurrentAsset } from '@editor/store/inputStore';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useInputActions');

/**
 * Hook to load input actions asset into InputManager
 * Loads the current asset from the input store and updates InputManager
 */
export const useInputActions = () => {
  const currentAsset = useCurrentAsset();

  useEffect(() => {
    if (!currentAsset) {
      logger.warn('No current input asset found');
      return;
    }

    const inputManager = InputManager.getInstance();

    // Load the asset into the runtime
    inputManager.loadInputActionsAsset(currentAsset);

    logger.info('Input actions asset loaded into InputManager', {
      assetName: currentAsset.name,
      actionMaps: currentAsset.actionMaps.length,
    });

    // No cleanup needed - InputManager persists across component lifecycles
  }, [currentAsset]);
};

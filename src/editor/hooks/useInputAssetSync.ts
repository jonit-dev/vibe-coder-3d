import { InputManager } from '@core/lib/input/InputManager';
import { Logger } from '@core/lib/logger';
import { useInputStore } from '@editor/store/inputStore';
import { useEffect } from 'react';

const logger = Logger.create('useInputAssetSync');

/**
 * Syncs input assets from the editor store to the InputManager
 * This ensures that input actions configured in the editor are available at runtime
 */
export const useInputAssetSync = () => {
  const currentAssetName = useInputStore((state) => state.currentAsset);
  const currentAsset = useInputStore((state) =>
    state.currentAsset ? state.assets.find((a) => a.name === state.currentAsset) : undefined,
  );
  const assets = useInputStore((state) => state.assets);

  // Load current asset into InputManager
  useEffect(() => {
    if (!currentAsset || !currentAssetName) {
      return;
    }

    try {
      const inputManager = InputManager.getInstance();

      // Check if InputManager is initialized
      if (!inputManager) {
        logger.warn('InputManager not initialized');
        return;
      }

      logger.info('Loading input asset into InputManager', {
        assetName: currentAsset.name,
        actionMaps: currentAsset.actionMaps.length,
      });

      // Load the asset into InputManager
      inputManager.loadInputActionsAsset(currentAsset);

      // Enable all enabled action maps
      currentAsset.actionMaps.forEach((map) => {
        if (map.enabled) {
          inputManager.enableActionMap(map.name);
          logger.debug('Enabled action map', { mapName: map.name });
        }
      });

      logger.milestone('Input asset loaded successfully', {
        assetName: currentAsset.name,
      });
    } catch (error) {
      logger.error('Failed to load input asset', {
        error,
        assetName: currentAsset.name,
      });
    }
  }, [currentAssetName]); // Only depend on the name, not the whole object

  // Log when assets change (for debugging)
  useEffect(() => {
    logger.debug('Input assets updated', {
      assetsCount: assets.length,
      assets: assets.map((a) => a.name),
    });
  }, [assets]);
};

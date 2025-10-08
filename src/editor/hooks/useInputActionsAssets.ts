import { useState, useEffect } from 'react';
import {
  IInputActionsAsset,
  InputActionsAssetSchema,
  DeviceType,
  ActionType,
  ControlType,
  CompositeType,
} from '@core/lib/input/inputTypes';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useInputActionsAssets');

const STORAGE_KEY = 'vibe-coder-input-actions-assets';

// Default asset for new projects
const createDefaultAsset = (): IInputActionsAsset => ({
  name: 'DefaultInputActions',
  controlSchemes: [
    {
      name: 'Keyboard&Mouse',
      deviceRequirements: [
        { deviceType: DeviceType.Keyboard, optional: false },
        { deviceType: DeviceType.Mouse, optional: false },
      ],
    },
    {
      name: 'Gamepad',
      deviceRequirements: [{ deviceType: DeviceType.Gamepad, optional: false }],
    },
  ],
  actionMaps: [
    {
      name: 'Gameplay',
      enabled: true,
      actions: [
        {
          name: 'Move',
          actionType: ActionType.PassThrough,
          controlType: ControlType.Vector2,
          enabled: true,
          bindings: [
            {
              compositeType: CompositeType.TwoDVector,
              bindings: {
                up: { type: DeviceType.Keyboard, path: 'w' },
                down: { type: DeviceType.Keyboard, path: 's' },
                left: { type: DeviceType.Keyboard, path: 'a' },
                right: { type: DeviceType.Keyboard, path: 'd' },
              },
            },
          ],
        },
        {
          name: 'Jump',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [{ type: DeviceType.Keyboard, path: 'space' }],
        },
        {
          name: 'Fire',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [{ type: DeviceType.Mouse, path: 'leftButton' }],
        },
      ],
    },
    {
      name: 'UI',
      enabled: true,
      actions: [
        {
          name: 'Navigate',
          actionType: ActionType.PassThrough,
          controlType: ControlType.Vector2,
          enabled: true,
          bindings: [
            {
              compositeType: CompositeType.TwoDVector,
              bindings: {
                up: { type: DeviceType.Keyboard, path: 'up' },
                down: { type: DeviceType.Keyboard, path: 'down' },
                left: { type: DeviceType.Keyboard, path: 'left' },
                right: { type: DeviceType.Keyboard, path: 'right' },
              },
            },
          ],
        },
        {
          name: 'Submit',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [{ type: DeviceType.Keyboard, path: 'enter' }],
        },
        {
          name: 'Cancel',
          actionType: ActionType.Button,
          controlType: ControlType.Button,
          enabled: true,
          bindings: [{ type: DeviceType.Keyboard, path: 'escape' }],
        },
      ],
    },
  ],
});

export interface IUseInputActionsAssetsReturn {
  assets: IInputActionsAsset[];
  currentAsset: IInputActionsAsset | null;
  setCurrentAsset: (asset: IInputActionsAsset | null) => void;
  createAsset: (name: string) => IInputActionsAsset;
  updateAsset: (asset: IInputActionsAsset) => void;
  deleteAsset: (assetName: string) => void;
  duplicateAsset: (assetName: string, newName: string) => IInputActionsAsset | null;
}

export const useInputActionsAssets = (): IUseInputActionsAssetsReturn => {
  const [assets, setAssets] = useState<IInputActionsAsset[]>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate each asset
        const validated = parsed
          .map((asset: unknown) => {
            const result = InputActionsAssetSchema.safeParse(asset);
            if (result.success) {
              return result.data;
            }
            logger.warn('Invalid asset in storage, skipping', { asset });
            return null;
          })
          .filter((asset: IInputActionsAsset | null) => asset !== null);

        if (validated.length > 0) {
          return validated;
        }
      } catch (e) {
        logger.error('Failed to parse input actions assets', { error: e });
      }
    }

    // Return default asset if nothing in storage
    return [createDefaultAsset()];
  });

  const [currentAsset, setCurrentAsset] = useState<IInputActionsAsset | null>(
    assets.length > 0 ? assets[0] : null,
  );

  // Save to localStorage whenever assets change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch (e) {
      logger.error('Failed to save input actions assets', { error: e });
    }
  }, [assets]);

  const createAsset = (name: string): IInputActionsAsset => {
    const newAsset: IInputActionsAsset = {
      name,
      controlSchemes: [
        {
          name: 'Keyboard&Mouse',
          deviceRequirements: [
            { deviceType: DeviceType.Keyboard, optional: false },
            { deviceType: DeviceType.Mouse, optional: false },
          ],
        },
      ],
      actionMaps: [],
    };

    setAssets((prev) => [...prev, newAsset]);
    setCurrentAsset(newAsset);
    return newAsset;
  };

  const updateAsset = (updatedAsset: IInputActionsAsset): void => {
    setAssets((prev) =>
      prev.map((asset) => (asset.name === updatedAsset.name ? updatedAsset : asset)),
    );

    // Update current asset if it's the one being updated
    if (currentAsset?.name === updatedAsset.name) {
      setCurrentAsset(updatedAsset);
    }
  };

  const deleteAsset = (assetName: string): void => {
    setAssets((prev) => prev.filter((asset) => asset.name !== assetName));

    // Clear current asset if it's the one being deleted
    if (currentAsset?.name === assetName) {
      setCurrentAsset(assets.length > 1 ? assets[0] : null);
    }
  };

  const duplicateAsset = (assetName: string, newName: string): IInputActionsAsset | null => {
    const originalAsset = assets.find((asset) => asset.name === assetName);
    if (!originalAsset) {
      logger.warn('Asset not found for duplication', { assetName });
      return null;
    }

    const duplicated: IInputActionsAsset = {
      ...originalAsset,
      name: newName,
    };

    setAssets((prev) => [...prev, duplicated]);
    return duplicated;
  };

  return {
    assets,
    currentAsset,
    setCurrentAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    duplicateAsset,
  };
};
